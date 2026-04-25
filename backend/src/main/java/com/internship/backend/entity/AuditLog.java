package com.internship.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;   // "RiskRecord"

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private String action;       // CREATE | UPDATE | DELETE

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;     // JSON before change

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;     // JSON after change

    @Column(name = "performed_by")
    private String performedBy;

    @Column(name = "performed_at")
    private LocalDateTime performedAt = LocalDateTime.now();
}
