package com.chalobabshakori.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/** A customer or a supplier. */
@Entity
@Table(name = "parties")
@Getter
@Setter
public class Party {
    public enum Type { CUSTOMER, SUPPLIER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_id")
    private Long businessId;

    @Enumerated(EnumType.STRING)
    private Type type;

    private String name;
    private String phone;
    private String address;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
