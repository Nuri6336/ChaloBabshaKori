package com.chalobabshakori.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class AppUser {
    public enum Role { OWNER, MANAGER, STAFF }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_id")
    private Long businessId;

    private String name;
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role = Role.OWNER;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
