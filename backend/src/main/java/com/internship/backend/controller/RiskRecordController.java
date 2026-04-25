package com.internship.backend.controller;

import com.internship.backend.dto.StatsResponse;
import com.internship.backend.entity.RiskRecord;
import com.internship.backend.service.RiskRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/api/risk-records")
@Tag(name = "Risk Records", description = "CRUD operations for risk records")
public class RiskRecordController {

    private final RiskRecordService service;

    public RiskRecordController(RiskRecordService service) {
        this.service = service;
    }

    @Operation(summary = "List all risk records with pagination")
    @GetMapping("/all")
    public ResponseEntity<Page<RiskRecord>> getAllRecords(
            @RequestParam(defaultValue = "0")         int    page,
            @RequestParam(defaultValue = "10")        int    size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc")      String sortDir) {
        return ResponseEntity.ok(service.getAllRecords(page, size, sortBy, sortDir));
    }

    @Operation(summary = "Get one risk record by ID")
    @GetMapping("/{id}")
    public ResponseEntity<RiskRecord> getRecordById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getRecordById(id));
    }

    @Operation(summary = "Create a new risk record")
    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<RiskRecord> createRecord(@Valid @RequestBody RiskRecord riskRecord) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.saveRecord(riskRecord));
    }

    @Operation(summary = "Update an existing risk record")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<RiskRecord> updateRecord(
            @PathVariable Long id,
            @Valid @RequestBody RiskRecord riskRecord) {
        return ResponseEntity.ok(service.updateRecord(id, riskRecord));
    }

    @Operation(summary = "Soft-delete a risk record")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        service.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Search risk records by keyword")
    @GetMapping("/search")
    public ResponseEntity<Page<RiskRecord>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.search(q, page, size));
    }

    @Operation(summary = "Get dashboard KPI statistics")
    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @Operation(summary = "Export all risk records as CSV")
    @GetMapping("/export")
    public void exportCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"risk-records.csv\"");
        List<RiskRecord> records = service.getAllForExport();
        PrintWriter writer = response.getWriter();
        writer.println("ID,Title,Category,Status,RiskScore,CreatedAt");
        for (RiskRecord r : records) {
            writer.printf("%d,\"%s\",\"%s\",\"%s\",%s,%s%n",
                    r.getId(),
                    escape(r.getTitle()),
                    escape(r.getCategory()),
                    escape(r.getStatus()),
                    r.getRiskScore() != null ? r.getRiskScore() : "",
                    r.getCreatedAt() != null ? r.getCreatedAt() : "");
        }
        writer.flush();
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}
