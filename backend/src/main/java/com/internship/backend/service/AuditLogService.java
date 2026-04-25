package com.internship.backend.service;

import com.internship.backend.entity.AuditLog;
import com.internship.backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /** Save one audit entry — called by the AOP aspect */
    public void log(String entityType, Long entityId, String action,
                    String oldValue, String newValue, String performedBy) {

        AuditLog entry = new AuditLog();
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setAction(action);
        entry.setOldValue(oldValue);
        entry.setNewValue(newValue);
        entry.setPerformedBy(performedBy);
        entry.setPerformedAt(LocalDateTime.now());

        auditLogRepository.save(entry);
    }

    /** Get audit history for a specific risk record */
    public List<AuditLog> getHistory(String entityType, Long entityId) {
        return auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc(entityType, entityId);
    }

    /** Get all actions by a specific user */
    public List<AuditLog> getByUser(String username) {
        return auditLogRepository
                .findByPerformedByOrderByPerformedAtDesc(username);
    }
}
