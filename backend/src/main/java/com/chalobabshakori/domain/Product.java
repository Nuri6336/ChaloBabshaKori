package com.chalobabshakori.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @Column(name = "business_id")
    private Long businessId;

    private String name;
    private String sku;
    private String barcode;
    private String category;
    private String unit;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "selling_price")
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "stock_qty")
    private int stockQty;

    @Column(name = "low_stock_threshold")
    private int lowStockThreshold = 5;

    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
