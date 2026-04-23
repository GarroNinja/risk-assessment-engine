package com.internship.backend.service;

import com.internship.backend.entity.RiskRecord;
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
        return repository.save(riskRecord);
    }

    public List<RiskRecord> getAllRecords() {
        return repository.findAll();
    }

    public List<RiskRecord> getByStatus(String status) {
        return repository.findByStatus(status);
    }

    public List<RiskRecord> getByCategory(String category) {
        return repository.findByCategory(category);
    }
}