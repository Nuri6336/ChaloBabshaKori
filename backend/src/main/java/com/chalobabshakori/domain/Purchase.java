package com.chalobabshakori.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "purchases")
@Getter
@Setter
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_id")
    private Long businessId;

    @Column(name = "bill_no")
    private String billNo;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    private BigDecimal total = BigDecimal.ZERO;
    private BigDecimal paid = BigDecimal.ZERO;
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();
}
