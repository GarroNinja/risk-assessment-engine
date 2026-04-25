package com.internship.backend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.backend.entity.RiskRecord;
import com.internship.backend.service.AuditLogService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Intercepts every Create / Update / Delete call in RiskRecordService
 * and writes an entry to audit_log automatically.
 *
 * No changes needed in RiskRecordService — this runs transparently.
 */
@Aspect
@Component
public class AuditAspect {

    private final AuditLogService auditLogService;
    private final ObjectMapper    objectMapper;

    public AuditAspect(AuditLogService auditLogService, ObjectMapper objectMapper) {
        this.auditLogService = auditLogService;
        this.objectMapper    = objectMapper;
    }

    // ── Intercept saveRecord (CREATE / UPDATE) ──────────────────────────────
    @Around("execution(* com.internship.backend.service.RiskRecordService.saveRecord(..))")
    public Object auditSave(ProceedingJoinPoint pjp) throws Throwable {

        Object[] args   = pjp.getArgs();
        RiskRecord input = (RiskRecord) args[0];

        // Determine action based on whether the record already has an id
        String action = (input.getId() == null) ? "CREATE" : "UPDATE";

        Object result = pjp.proceed();

        RiskRecord saved = (RiskRecord) result;

        auditLogService.log(
                "RiskRecord",
                saved.getId(),
                action,
                null,                          // no old value on create
                toJson(saved),
                currentUser()
        );

        return result;
    }

    // ── Intercept deleteRecord (soft DELETE) ────────────────────────────────
    @Around("execution(* com.internship.backend.service.RiskRecordService.deleteRecord(..))")
    public Object auditDelete(ProceedingJoinPoint pjp) throws Throwable {

        Long id = (Long) pjp.getArgs()[0];

        Object result = pjp.proceed();

        auditLogService.log(
                "RiskRecord",
                id,
                "DELETE",
                null,
                null,
                currentUser()
        );

        return result;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private String currentUser() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            return (auth != null) ? auth.getName() : "system";
        } catch (Exception e) {
            return "system";
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }
}
