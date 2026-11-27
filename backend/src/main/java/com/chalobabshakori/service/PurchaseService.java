package com.chalobabshakori.service;

import com.chalobabshakori.domain.Party;
import com.chalobabshakori.domain.Payment;
import com.chalobabshakori.domain.Purchase;
import com.chalobabshakori.domain.PurchaseItem;
import com.chalobabshakori.domain.Product;
import com.chalobabshakori.repo.PartyRepository;
import com.chalobabshakori.repo.PaymentRepository;
import com.chalobabshakori.repo.ProductRepository;
import com.chalobabshakori.repo.PurchaseRepository;
import com.chalobabshakori.web.ApiException;
import com.chalobabshakori.web.dto.Dtos.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PurchaseService {
    private final PurchaseRepository purchases;
    private final ProductRepository products;
    private final PartyRepository parties;
    private final PaymentRepository payments;

    public PurchaseService(PurchaseRepository purchases, ProductRepository products, PartyRepository parties,
                           PaymentRepository payments) {
        this.purchases = purchases;
        this.products = products;
        this.parties = parties;
        this.payments = payments;
    }

    @Transactional
    public PurchaseResponse create(Long businessId, PurchaseRequest req) {
        Party supplier = null;
        if (req.supplierId() != null) {
            supplier = parties.findByIdAndBusinessIdAndType(req.supplierId(), businessId, Party.Type.SUPPLIER)
                    .orElseThrow(() -> ApiException.notFound("Supplier"));
        }

        Purchase purchase = new Purchase();
        purchase.setBusinessId(businessId);
        purchase.setSupplierId(req.supplierId());
        purchase.setPurchaseDate(req.purchaseDate() != null ? req.purchaseDate() : LocalDate.now());
        purchase.setNote(req.note());
        purchase.setBillNo(String.format("PUR-%05d", purchases.countByBusinessId(businessId) + 1));

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseItemRequest line : req.items()) {
            Product product = products.lockByIdAndBusinessId(line.productId(), businessId)
                    .orElseThrow(() -> ApiException.notFound("Product " + line.productId()));
            BigDecimal lineTotal = line.unitCost().multiply(BigDecimal.valueOf(line.qty()));
            PurchaseItem item = new PurchaseItem();
            item.setPurchase(purchase);
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setQty(line.qty());
            item.setUnitCost(line.unitCost());
            item.setLineTotal(lineTotal);
            purchase.getItems().add(item);
            total = total.add(lineTotal);

            product.setStockQty(product.getStockQty() + line.qty());
            product.setPurchasePrice(line.unitCost());
        }
        purchase.setTotal(total);

        BigDecimal paid = req.paid() != null ? req.paid() : BigDecimal.ZERO;
        if (paid.compareTo(total) > 0) {
            throw ApiException.badRequest("Paid amount cannot exceed the total");
        }
        purchase.setPaid(paid);
        purchase = purchases.save(purchase);

        if (paid.signum() > 0) {
            recordPayment(businessId, purchase.getId(), paid, "CASH");
        }
        return toResponse(purchase, supplier);
    }

    @Transactional
    public PurchaseResponse addPayment(Long businessId, Long id, PaymentRequest req) {
        Purchase purchase = find(businessId, id);
        BigDecimal due = purchase.getTotal().subtract(purchase.getPaid());
        if (req.amount().compareTo(due) > 0) {
            throw ApiException.badRequest("Payment exceeds the outstanding amount (" + due + ")");
        }
        purchase.setPaid(purchase.getPaid().add(req.amount()));
        recordPayment(businessId, id, req.amount(), req.method());
        return toResponse(purchase, supplierOf(purchase));
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> list(Long businessId, LocalDate from, LocalDate to) {
        return purchases.findByBusinessIdAndPurchaseDateBetweenOrderByPurchaseDateDescIdDesc(businessId, from, to)
                .stream().map(p -> toResponse(p, supplierOf(p))).toList();
    }

    @Transactional(readOnly = true)
    public PurchaseResponse get(Long businessId, Long id) {
        Purchase p = find(businessId, id);
        return toResponse(p, supplierOf(p));
    }

    /** Deleting a purchase takes its stock back out; refused if that stock has already been sold. */
    @Transactional
    public void delete(Long businessId, Long id) {
        Purchase purchase = find(businessId, id);
        for (PurchaseItem item : purchase.getItems()) {
            products.lockByIdAndBusinessId(item.getProductId(), businessId).ifPresent(product -> {
                if (product.getStockQty() < item.getQty()) {
                    throw ApiException.conflict("Cannot delete: stock of " + product.getName() + " has already been sold");
                }
                product.setStockQty(product.getStockQty() - item.getQty());
            });
        }
        payments.deleteAll(payments.findByBusinessIdAndRefTypeAndRefIdOrderByPaidAtAsc(
                businessId, Payment.RefType.PURCHASE, id));
        purchases.delete(purchase);
    }

    private Purchase find(Long businessId, Long id) {
        return purchases.findByIdAndBusinessId(id, businessId).orElseThrow(() -> ApiException.notFound("Purchase"));
    }

    private Party supplierOf(Purchase p) {
        return p.getSupplierId() == null ? null : parties.findById(p.getSupplierId()).orElse(null);
    }

    private void recordPayment(Long businessId, Long refId, BigDecimal amount, String method) {
        Payment pay = new Payment();
        pay.setBusinessId(businessId);
        pay.setRefType(Payment.RefType.PURCHASE);
        pay.setRefId(refId);
        pay.setAmount(amount);
        pay.setMethod(method == null ? "CASH" : method);
        payments.save(pay);
    }

    private PurchaseResponse toResponse(Purchase p, Party supplier) {
        List<LineResponse> lines = p.getItems().stream()
                .map(i -> new LineResponse(i.getProductId(), i.getProductName(), i.getQty(), i.getUnitCost(), i.getLineTotal()))
                .toList();
        List<PaymentResponse> pays = payments
                .findByBusinessIdAndRefTypeAndRefIdOrderByPaidAtAsc(p.getBusinessId(), Payment.RefType.PURCHASE, p.getId())
                .stream().map(x -> new PaymentResponse(x.getId(), x.getAmount(), x.getMethod(), x.getPaidAt())).toList();
        return new PurchaseResponse(p.getId(), p.getBillNo(), p.getSupplierId(),
                supplier == null ? null : supplier.getName(), p.getPurchaseDate(), p.getTotal(), p.getPaid(),
                p.getTotal().subtract(p.getPaid()), p.getNote(), lines, pays);
    }
}
