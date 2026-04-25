package com.internship.backend.controller;

import com.internship.backend.entity.AuditLog;
import com.internship.backend.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit Log", description = "View change history — ADMIN and MANAGER only")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /** GET /api/audit/record/{id} — full history for one risk record */
    @Operation(summary = "Get audit history for a specific risk record")
    @GetMapping("/record/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<AuditLog>> getRecordHistory(@PathVariable Long id) {
        return ResponseEntity.ok(
                auditLogService.getHistory("RiskRecord", id));
    }

    /** GET /api/audit/user/{username} — all actions by a specific user */
    @Operation(summary = "Get all audit entries by a specific user")
    @GetMapping("/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getUserAudit(@PathVariable String username) {
        return ResponseEntity.ok(auditLogService.getByUser(username));
    }
}
