package com.internship.backend.repository;

import com.internship.backend.entity.RiskRecord;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class RiskRecordRepositoryTest {

    @Autowired
    private RiskRecordRepository repository;

    private RiskRecord sampleRecord() {
        RiskRecord record = new RiskRecord();
        record.setTitle("Server Risk");
        record.setCategory("Infrastructure");
        record.setStatus("OPEN");
        record.setDescription("Testing");
        record.setRiskScore(8);
        return record;
    }

    @Test
    void findByStatus_shouldReturnRecords() {

        repository.save(sampleRecord());

        List<RiskRecord> records = repository.findByStatus("OPEN");

        assertFalse(records.isEmpty());
        assertEquals("OPEN", records.get(0).getStatus());
    }

    @Test
    void findByCategory_shouldReturnRecords() {

        repository.save(sampleRecord());

        List<RiskRecord> records =
                repository.findByCategory("Infrastructure");

        assertFalse(records.isEmpty());
        assertEquals("Infrastructure",
                records.get(0).getCategory());
    }
}