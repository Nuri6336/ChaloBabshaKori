package com.chalobabshakori.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "sale_items")
@Getter
@Setter
public class SaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    private int qty;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "cost_price")
    private BigDecimal costPrice;

    @Column(name = "line_total")
    private BigDecimal lineTotal;
}
