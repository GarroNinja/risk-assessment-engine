package com.internship.backend.repository;

import com.internship.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // All audit entries for one specific record
    List<AuditLog> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(
            String entityType, Long entityId);

    // All entries by a specific user
    List<AuditLog> findByPerformedByOrderByPerformedAtDesc(String performedBy);
}
