package com.internship.backend.service;

import com.internship.backend.dto.StatsResponse;
import com.internship.backend.entity.RiskRecord;
import com.internship.backend.exception.ResourceNotFoundException;
import com.internship.backend.repository.RiskRecordRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiskRecordService {

    private final RiskRecordRepository repository;
    private final EmailService          emailService;

    public RiskRecordService(RiskRecordRepository repository,
                             EmailService emailService) {
        this.repository   = repository;
        this.emailService = emailService;
    }

    // ── Create / Update ─────────────────────────────────────────────────────
    @CacheEvict(value = {"riskRecords", "riskRecord"}, allEntries = true)
    public RiskRecord saveRecord(RiskRecord riskRecord) {
        validate(riskRecord);
        RiskRecord saved = repository.save(riskRecord);
        new Thread(() -> {
            try { emailService.sendCreateNotification(saved); }
            catch (Exception e) { System.out.println("Email skipped: " + e.getMessage()); }
        }).start();
        return saved;
    }

    @CacheEvict(value = {"riskRecords", "riskRecord"}, allEntries = true)
    public RiskRecord updateRecord(Long id, RiskRecord incoming) {
        RiskRecord existing = getRecordById(id);
        existing.setTitle(incoming.getTitle());
        existing.setDescription(incoming.getDescription());
        existing.setCategory(incoming.getCategory());
        existing.setStatus(incoming.getStatus());
        existing.setRiskScore(incoming.getRiskScore());
        return repository.save(existing);
    }

    // ── Read ────────────────────────────────────────────────────────────────
    @Cacheable("riskRecords")
    public Page<RiskRecord> getAllRecords(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return repository.findByDeletedFalse(PageRequest.of(page, size, sort));
    }

    @Cacheable(value = "riskRecord", key = "#id")
    public RiskRecord getRecordById(Long id) {
        return repository.findById(id)
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .orElseThrow(() ->
                        new ResourceNotFoundException("Risk record not found: " + id));
    }

    public Page<RiskRecord> search(String keyword, int page, int size) {
        return repository.searchByKeyword(keyword, PageRequest.of(page, size));
    }

    public List<RiskRecord> getAllForExport() {
        return repository.findByDeletedFalseOrderByCreatedAtDesc();
    }

    // ── Delete (soft) ───────────────────────────────────────────────────────
    @CacheEvict(value = {"riskRecords", "riskRecord"}, allEntries = true)
    public void deleteRecord(Long id) {
        RiskRecord record = getRecordById(id);
        record.setDeleted(true);
        repository.save(record);
    }

    // ── Stats for dashboard ─────────────────────────────────────────────────
    public StatsResponse getStats() {
        long highRisk = repository.findHighScoreOpenRisks().size();
        return StatsResponse.builder()
                .total(repository.countByDeletedFalse())
                .openCount(repository.countByStatusAndDeletedFalse("OPEN"))
                .inProgressCount(repository.countByStatusAndDeletedFalse("IN_PROGRESS"))
                .closedCount(repository.countByStatusAndDeletedFalse("CLOSED"))
                .averageRiskScore(repository.averageRiskScore())
                .highRiskCount(highRisk)
                .build();
    }

    // ── Legacy helpers kept for backwards compat ────────────────────────────
    public List<RiskRecord> getByStatus(String status) {
        return repository.findByStatusAndDeletedFalse(status);
    }

    public List<RiskRecord> getByCategory(String category) {
        return repository.findByCategoryAndDeletedFalse(category);
    }

    // ── Private ─────────────────────────────────────────────────────────────
    private void validate(RiskRecord r) {
        if (r.getTitle() == null || r.getTitle().isBlank())
            throw new IllegalArgumentException("Title is required");
        if (r.getCategory() == null || r.getCategory().isBlank())
            throw new IllegalArgumentException("Category is required");
        if (r.getStatus() == null || r.getStatus().isBlank())
            throw new IllegalArgumentException("Status is required");
    }
}
