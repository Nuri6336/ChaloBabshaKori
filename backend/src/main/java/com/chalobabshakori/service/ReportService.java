package com.chalobabshakori.service;

import com.chalobabshakori.domain.Product;
import com.chalobabshakori.repo.ExpenseRepository;
import com.chalobabshakori.repo.ProductRepository;
import com.chalobabshakori.repo.PurchaseRepository;
import com.chalobabshakori.repo.SaleRepository;
import com.chalobabshakori.web.ApiException;
import com.chalobabshakori.web.dto.Dtos.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportService {
    private static final long MAX_RANGE_DAYS = 400;

    private final SaleRepository sales;
    private final PurchaseRepository purchases;
    private final ExpenseRepository expenses;
    private final ProductRepository products;

    public ReportService(SaleRepository sales, PurchaseRepository purchases, ExpenseRepository expenses,
                         ProductRepository products) {
        this.sales = sales;
        this.purchases = purchases;
        this.expenses = expenses;
        this.products = products;
    }

    public Summary summary(Long b, LocalDate from, LocalDate to) {
        validate(from, to);
        BigDecimal totalSales = sales.totalSales(b, from, to);
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        BigDecimal previous = sales.totalSales(b, from.minusDays(days), from.minusDays(1));
        BigDecimal change = previous.signum() == 0 ? null
                : totalSales.subtract(previous).multiply(BigDecimal.valueOf(100)).divide(previous, 1, RoundingMode.HALF_UP);
        BigDecimal cogs = sales.costOfGoodsSold(b, from, to);
        BigDecimal gross = totalSales.subtract(cogs);
        BigDecimal exp = expenses.totalExpenses(b, from, to);
        return new Summary(from, to, totalSales, previous, change, purchases.totalPurchases(b, from, to), exp, cogs,
                gross, gross.subtract(exp));
    }

    public Dashboard dashboard(Long b, LocalDate from, LocalDate to) {
        Summary summary = summary(b, from, to);
        List<LowStockItem> low = products.findLowStock(b).stream()
                .map(p -> new LowStockItem(p.getId(), p.getName(), p.getStockQty(), p.getLowStockThreshold()))
                .limit(10).toList();
        return new Dashboard(summary, products.stockValue(b), products.totalUnits(b), sales.totalReceivable(b),
                purchases.totalPayable(b), low, dailySales(b, from, to));
    }

    /** One point per day in the range, with zero-filled gaps. */
    public List<TrendPoint> dailySales(Long b, LocalDate from, LocalDate to) {
        validate(from, to);
        Map<LocalDate, Object[]> byDay = new HashMap<>();
        for (Object[] row : sales.dailySales(b, from, to)) {
            byDay.put(toLocalDate(row[0]), row);
        }
        List<TrendPoint> out = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            Object[] row = byDay.get(d);
            out.add(row == null ? new TrendPoint(d, BigDecimal.ZERO, 0)
                    : new TrendPoint(d, (BigDecimal) row[1], ((Number) row[2]).longValue()));
        }
        return out;
    }

    public List<CategoryTotal> expensesByCategory(Long b, LocalDate from, LocalDate to) {
        validate(from, to);
        return expenses.totalsByCategory(b, from, to).stream()
                .map(r -> new CategoryTotal((String) r[0], (BigDecimal) r[1])).toList();
    }

    public StockReport stock(Long b) {
        List<Product> list = products.findByBusinessIdAndActiveTrueOrderByNameAsc(b);
        List<StockRow> rows = list.stream()
                .map(p -> new StockRow(p.getId(), p.getName(), p.getSku(), p.getStockQty(), p.getPurchasePrice(),
                        p.getPurchasePrice().multiply(BigDecimal.valueOf(p.getStockQty()))))
                .toList();
        return new StockReport(products.stockValue(b), products.totalUnits(b), rows);
    }

    private void validate(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw ApiException.badRequest("'from' must not be after 'to'");
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw ApiException.badRequest("Date range is too large (max " + MAX_RANGE_DAYS + " days)");
        }
    }

    private static LocalDate toLocalDate(Object o) {
        return o instanceof Date d ? d.toLocalDate() : (LocalDate) o;
    }
}
