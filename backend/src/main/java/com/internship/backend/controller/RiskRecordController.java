package com.internship.backend.controller;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.service.RiskRecordService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/risk-records")
public class RiskRecordController {

    private final RiskRecordService service;

    public RiskRecordController(RiskRecordService service) {
        this.service = service;
    }

    @GetMapping("/all")
    public ResponseEntity<Page<RiskRecord>> getAllRecords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        List<RiskRecord> records = service.getAllRecords();

        int start = Math.min(page * size, records.size());
        int end = Math.min(start + size, records.size());

        Page<RiskRecord> result =
                new PageImpl<>(records.subList(start, end));

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RiskRecord> getRecordById(@PathVariable Long id) {
        RiskRecord record = service.getRecordById(id);
        return ResponseEntity.ok(record);
    }

    @PostMapping("/create")
    public ResponseEntity<RiskRecord> createRecord(
            @Valid @RequestBody RiskRecord riskRecord) {

        RiskRecord saved = service.saveRecord(riskRecord);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}