package com.internship.backend.service;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.exception.ResourceNotFoundException;
import com.internship.backend.repository.RiskRecordRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiskRecordService {

    private final RiskRecordRepository repository;

    public RiskRecordService(RiskRecordRepository repository) {
        this.repository = repository;
    }

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

    public List<RiskRecord> getAllRecords() {
        return repository.findAll();
    }

    public RiskRecord getRecordById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk record not found with id: " + id));
    }

    public List<RiskRecord> getByStatus(String status) {
        return repository.findByStatus(status);
    }

    public List<RiskRecord> getByCategory(String category) {
        return repository.findByCategory(category);
    }

    public void deleteRecord(Long id) {
        RiskRecord record = getRecordById(id);
        repository.delete(record);
    }
}