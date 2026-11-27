package com.chalobabshakori.web;

import com.chalobabshakori.security.CurrentUser;
import com.chalobabshakori.service.ReportService;
import com.chalobabshakori.web.dto.Dtos.*;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ReportController {
    private final ReportService reports;

    public ReportController(ReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/dashboard")
    public Dashboard dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reports.dashboard(CurrentUser.businessId(), start(from, to), end(to));
    }

    @GetMapping("/reports/summary")
    public Summary summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reports.summary(CurrentUser.businessId(), start(from, to), end(to));
    }

    @GetMapping("/reports/daily-sales")
    public List<TrendPoint> dailySales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reports.dailySales(CurrentUser.businessId(), start(from, to), end(to));
    }

    @GetMapping("/reports/expenses-by-category")
    public List<CategoryTotal> expensesByCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reports.expensesByCategory(CurrentUser.businessId(), start(from, to), end(to));
    }

    @GetMapping("/reports/stock")
    public StockReport stock() {
        return reports.stock(CurrentUser.businessId());
    }

    private static LocalDate end(LocalDate to) {
        return to != null ? to : LocalDate.now();
    }

    private static LocalDate start(LocalDate from, LocalDate to) {
        return from != null ? from : end(to).withDayOfMonth(1);
    }
}
