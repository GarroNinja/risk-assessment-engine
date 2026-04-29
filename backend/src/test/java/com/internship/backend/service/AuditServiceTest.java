package com.internship.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuditServiceTest {

    private final AuditService auditService = new AuditService();

    @Test
    void logAction_shouldReturnMessage() {

        String result = auditService.logAction("Created Risk");

        assertEquals("AUDIT: Created Risk", result);
    }

    @Test
    void isValidAction_shouldReturnTrue() {

        assertTrue(auditService.isValidAction("Delete Risk"));
    }

    @Test
    void isValidAction_shouldReturnFalse() {

        assertFalse(auditService.isValidAction(""));
    }
}