package com.chalobabshakori.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment {
    public enum RefType { SALE, PURCHASE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_id")
    private Long businessId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type")
    private RefType refType;

    @Column(name = "ref_id")
    private Long refId;

    private BigDecimal amount;
    private String method;

    @Column(name = "paid_at")
    private LocalDateTime paidAt = LocalDateTime.now();
}
