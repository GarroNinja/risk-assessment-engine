package com.internship.backend.service;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.exception.ResourceNotFoundException;
import com.internship.backend.repository.RiskRecordRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiskRecordService {

    private final RiskRecordRepository repository;

    public RiskRecordService(RiskRecordRepository repository) {
        this.repository = repository;
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

        return repository.save(riskRecord);
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