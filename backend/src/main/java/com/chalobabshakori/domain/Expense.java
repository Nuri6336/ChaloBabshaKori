package com.chalobabshakori.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "expenses")
@Getter
@Setter
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @Column(name = "business_id")
    private Long businessId;

    private String title;
    private String category;
    private BigDecimal amount;

    @Column(name = "expense_date")
    private LocalDate expenseDate;

    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
