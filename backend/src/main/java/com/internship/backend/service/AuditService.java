package com.internship.backend.service;

import org.springframework.stereotype.Service;

@Service
public class AuditService {

    public String logAction(String action) {
        return "AUDIT: " + action;
    }

    public boolean isValidAction(String action) {
        return action != null && !action.trim().isEmpty();
    }
}