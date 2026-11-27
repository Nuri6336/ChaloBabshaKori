package com.chalobabshakori.service;

import com.chalobabshakori.domain.Party;
import com.chalobabshakori.domain.Payment;
import com.chalobabshakori.domain.Product;
import com.chalobabshakori.domain.Sale;
import com.chalobabshakori.domain.SaleItem;
import com.chalobabshakori.repo.PartyRepository;
import com.chalobabshakori.repo.PaymentRepository;
import com.chalobabshakori.repo.ProductRepository;
import com.chalobabshakori.repo.SaleRepository;
import com.chalobabshakori.web.ApiException;
import com.chalobabshakori.web.dto.Dtos.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SaleService {
    private final SaleRepository sales;
    private final ProductRepository products;
    private final PartyRepository parties;
    private final PaymentRepository payments;

    public SaleService(SaleRepository sales, ProductRepository products, PartyRepository parties,
                       PaymentRepository payments) {
        this.sales = sales;
        this.products = products;
        this.parties = parties;
        this.payments = payments;
    }

    @Transactional
    public SaleResponse create(Long businessId, SaleRequest req) {
        Party customer = null;
        if (req.customerId() != null) {
            customer = parties.findByIdAndBusinessIdAndType(req.customerId(), businessId, Party.Type.CUSTOMER)
                    .orElseThrow(() -> ApiException.notFound("Customer"));
        }

        Sale sale = new Sale();
        sale.setBusinessId(businessId);
        sale.setCustomerId(req.customerId());
        sale.setSaleDate(req.saleDate() != null ? req.saleDate() : LocalDate.now());
        sale.setNote(req.note());
        sale.setInvoiceNo(String.format("INV-%05d", sales.countByBusinessId(businessId) + 1));

        BigDecimal subtotal = BigDecimal.ZERO;
        for (SaleItemRequest line : req.items()) {
            Product product = products.lockByIdAndBusinessId(line.productId(), businessId)
                    .orElseThrow(() -> ApiException.notFound("Product " + line.productId()));
            if (product.getStockQty() < line.qty()) {
                throw ApiException.conflict("Insufficient stock for " + product.getName()
                        + " (available " + product.getStockQty() + ")");
            }
            BigDecimal price = line.unitPrice() != null ? line.unitPrice() : product.getSellingPrice();
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(line.qty()));

            SaleItem item = new SaleItem();
            item.setSale(sale);
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setQty(line.qty());
            item.setUnitPrice(price);
            item.setCostPrice(product.getPurchasePrice());
            item.setLineTotal(lineTotal);
            sale.getItems().add(item);
            subtotal = subtotal.add(lineTotal);

            product.setStockQty(product.getStockQty() - line.qty());
        }

        BigDecimal discount = req.discount() != null ? req.discount() : BigDecimal.ZERO;
        BigDecimal tax = req.tax() != null ? req.tax() : BigDecimal.ZERO;
        if (discount.compareTo(subtotal) > 0) {
            throw ApiException.badRequest("Discount cannot exceed the subtotal");
        }
        BigDecimal total = subtotal.subtract(discount).add(tax);
        BigDecimal paid = req.paid() != null ? req.paid() : BigDecimal.ZERO;
        if (paid.compareTo(total) > 0) {
            throw ApiException.badRequest("Paid amount cannot exceed the total");
        }
        if (customer == null && paid.compareTo(total) < 0) {
            throw ApiException.badRequest("Select a customer to record a sale with a due balance");
        }
        sale.setSubtotal(subtotal);
        sale.setDiscount(discount);
        sale.setTax(tax);
        sale.setTotal(total);
        sale.setPaid(paid);
        sale = sales.save(sale);

        if (paid.signum() > 0) {
            recordPayment(businessId, sale.getId(), paid, "CASH");
        }
        return toResponse(sale, customer);
    }

    @Transactional
    public SaleResponse addPayment(Long businessId, Long id, PaymentRequest req) {
        Sale sale = find(businessId, id);
        BigDecimal due = sale.getTotal().subtract(sale.getPaid());
        if (req.amount().compareTo(due) > 0) {
            throw ApiException.badRequest("Payment exceeds the outstanding amount (" + due + ")");
        }
        sale.setPaid(sale.getPaid().add(req.amount()));
        recordPayment(businessId, id, req.amount(), req.method());
        return toResponse(sale, customerOf(sale));
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> list(Long businessId, LocalDate from, LocalDate to) {
        return sales.findByBusinessIdAndSaleDateBetweenOrderBySaleDateDescIdDesc(businessId, from, to)
                .stream().map(s -> toResponse(s, customerOf(s))).toList();
    }

    @Transactional(readOnly = true)
    public SaleResponse get(Long businessId, Long id) {
        Sale s = find(businessId, id);
        return toResponse(s, customerOf(s));
    }

    /** Deleting a sale puts the sold stock back. */
    @Transactional
    public void delete(Long businessId, Long id) {
        Sale sale = find(businessId, id);
        for (SaleItem item : sale.getItems()) {
            products.lockByIdAndBusinessId(item.getProductId(), businessId)
                    .ifPresent(p -> p.setStockQty(p.getStockQty() + item.getQty()));
        }
        payments.deleteAll(payments.findByBusinessIdAndRefTypeAndRefIdOrderByPaidAtAsc(
                businessId, Payment.RefType.SALE, id));
        sales.delete(sale);
    }

    private Sale find(Long businessId, Long id) {
        return sales.findByIdAndBusinessId(id, businessId).orElseThrow(() -> ApiException.notFound("Sale"));
    }

    private Party customerOf(Sale s) {
        return s.getCustomerId() == null ? null : parties.findById(s.getCustomerId()).orElse(null);
    }

    private void recordPayment(Long businessId, Long refId, BigDecimal amount, String method) {
        Payment pay = new Payment();
        pay.setBusinessId(businessId);
        pay.setRefType(Payment.RefType.SALE);
        pay.setRefId(refId);
        pay.setAmount(amount);
        pay.setMethod(method == null ? "CASH" : method);
        payments.save(pay);
    }

    private SaleResponse toResponse(Sale s, Party customer) {
        List<LineResponse> lines = s.getItems().stream()
                .map(i -> new LineResponse(i.getProductId(), i.getProductName(), i.getQty(), i.getUnitPrice(), i.getLineTotal()))
                .toList();
        List<PaymentResponse> pays = payments
                .findByBusinessIdAndRefTypeAndRefIdOrderByPaidAtAsc(s.getBusinessId(), Payment.RefType.SALE, s.getId())
                .stream().map(x -> new PaymentResponse(x.getId(), x.getAmount(), x.getMethod(), x.getPaidAt())).toList();
        return new SaleResponse(s.getId(), s.getInvoiceNo(), s.getCustomerId(),
                customer == null ? null : customer.getName(), s.getSaleDate(), s.getSubtotal(), s.getDiscount(),
                s.getTax(), s.getTotal(), s.getPaid(), s.getTotal().subtract(s.getPaid()), s.getNote(), lines, pays);
    }
}
