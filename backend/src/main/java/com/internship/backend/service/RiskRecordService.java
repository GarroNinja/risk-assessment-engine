package com.internship.backend.service;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.exception.ResourceNotFoundException;
import com.internship.backend.repository.RiskRecordRepository;
import jakarta.mail.MessagingException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiskRecordService {

    private final RiskRecordRepository repository;
    private final EmailService emailService;

    public RiskRecordService(RiskRecordRepository repository,
                             EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    @CacheEvict(value = {"riskRecords", "riskRecord"}, allEntries = true)
    public RiskRecord saveRecord(RiskRecord riskRecord) {

        if (riskRecord.getTitle() == null || riskRecord.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }

        if (riskRecord.getCategory() == null || riskRecord.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }

        if (riskRecord.getStatus() == null || riskRecord.getStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }

        RiskRecord saved = repository.save(riskRecord);

        try {
            emailService.sendCreateNotification(saved);
        } catch (MessagingException e) {
            e.printStackTrace();
        }

        return saved;
    }

    @Cacheable("riskRecords")
    public List<RiskRecord> getAllRecords() {
        return repository.findAll();
    }

    @Cacheable(value = "riskRecord", key = "#id")
    public RiskRecord getRecordById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Risk record not found with id: " + id));
    }

    public List<RiskRecord> getByStatus(String status) {
        return repository.findByStatus(status);
    }

    public List<RiskRecord> getByCategory(String category) {
        return repository.findByCategory(category);
    }

    @CacheEvict(value = {"riskRecords", "riskRecord"}, allEntries = true)
    public void deleteRecord(Long id) {
        RiskRecord record = getRecordById(id);
        repository.delete(record);
    }
}