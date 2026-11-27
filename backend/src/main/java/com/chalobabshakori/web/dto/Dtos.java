package com.chalobabshakori.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    // ---- auth ----
    public record RegisterRequest(
            @NotBlank @Size(max = 150) String businessName,
            @NotBlank @Size(max = 120) String ownerName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @Size(max = 30) String phone) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record AuthResponse(String token, Long userId, String name, String email, String role,
                               Long businessId, String businessName) {}

    // ---- products ----
    public record ProductRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 60) String sku,
            @Size(max = 60) String barcode,
            @Size(max = 80) String category,
            @Size(max = 30) String unit,
            @NotNull @DecimalMin("0") BigDecimal purchasePrice,
            @NotNull @DecimalMin("0") BigDecimal sellingPrice,
            @Min(0) Integer stockQty,
            @Min(0) Integer lowStockThreshold) {}

    public record StockAdjustRequest(int delta, @Size(max = 255) String reason) {}

    // ---- customers / suppliers ----
    public record PartyRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 30) String phone,
            @Size(max = 255) String address) {}

    public record PartyResponse(Long id, String name, String phone, String address, BigDecimal balance) {}

    // ---- sales ----
    public record SaleItemRequest(@NotNull Long productId, @Min(1) int qty, @DecimalMin("0") BigDecimal unitPrice) {}

    public record SaleRequest(
            Long customerId,
            LocalDate saleDate,
            @NotEmpty @Valid List<SaleItemRequest> items,
            @DecimalMin("0") BigDecimal discount,
            @DecimalMin("0") BigDecimal tax,
            @DecimalMin("0") BigDecimal paid,
            @Size(max = 255) String note) {}

    public record LineResponse(Long productId, String productName, int qty, BigDecimal unitPrice, BigDecimal lineTotal) {}

    public record PaymentRequest(@NotNull @DecimalMin("0.01") BigDecimal amount, @Size(max = 30) String method) {}

    public record PaymentResponse(Long id, BigDecimal amount, String method, LocalDateTime paidAt) {}

    public record SaleResponse(Long id, String invoiceNo, Long customerId, String customerName, LocalDate saleDate,
                               BigDecimal subtotal, BigDecimal discount, BigDecimal tax, BigDecimal total,
                               BigDecimal paid, BigDecimal due, String note, List<LineResponse> items,
                               List<PaymentResponse> payments) {}

    // ---- purchases ----
    public record PurchaseItemRequest(@NotNull Long productId, @Min(1) int qty, @NotNull @DecimalMin("0") BigDecimal unitCost) {}

    public record PurchaseRequest(
            Long supplierId,
            LocalDate purchaseDate,
            @NotEmpty @Valid List<PurchaseItemRequest> items,
            @DecimalMin("0") BigDecimal paid,
            @Size(max = 255) String note) {}

    public record PurchaseResponse(Long id, String billNo, Long supplierId, String supplierName, LocalDate purchaseDate,
                                   BigDecimal total, BigDecimal paid, BigDecimal due, String note,
                                   List<LineResponse> items, List<PaymentResponse> payments) {}

    // ---- expenses ----
    public record ExpenseRequest(
            @NotBlank @Size(max = 160) String title,
            @Size(max = 80) String category,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            LocalDate expenseDate,
            @Size(max = 255) String note) {}

    // ---- reports ----
    public record TrendPoint(LocalDate date, BigDecimal total, long count) {}

    public record LowStockItem(Long id, String name, int stockQty, int lowStockThreshold) {}

    public record Summary(LocalDate from, LocalDate to, BigDecimal totalSales, BigDecimal previousSales,
                          BigDecimal salesChangePct, BigDecimal totalPurchases, BigDecimal totalExpenses,
                          BigDecimal costOfGoodsSold, BigDecimal grossProfit, BigDecimal netProfit) {}

    public record Dashboard(Summary summary, BigDecimal stockValue, long totalUnits, BigDecimal receivable,
                            BigDecimal payable, List<LowStockItem> lowStock, List<TrendPoint> salesTrend) {}

    public record CategoryTotal(String category, BigDecimal total) {}

    public record StockRow(Long id, String name, String sku, int stockQty, BigDecimal purchasePrice, BigDecimal value) {}

    public record StockReport(BigDecimal totalValue, long totalUnits, List<StockRow> rows) {}
}
