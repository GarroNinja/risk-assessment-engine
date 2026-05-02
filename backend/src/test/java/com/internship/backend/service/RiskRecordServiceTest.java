package com.internship.backend.service;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.exception.ResourceNotFoundException;
import com.internship.backend.repository.RiskRecordRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskRecordServiceTest {

    @Mock
    private RiskRecordRepository repository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private RiskRecordService service;

    private RiskRecord sampleRecord() {
        RiskRecord record = new RiskRecord();
        record.setId(1L);
        record.setTitle("Server Risk");
        record.setCategory("Infrastructure");
        record.setStatus("OPEN");
        record.setDescription("Test");
        record.setRiskScore(8);
        return record;
    }

    @Test
    void saveRecord_shouldSaveSuccessfully() {
        RiskRecord record = sampleRecord();
        when(repository.save(record)).thenReturn(record);
        RiskRecord saved = service.saveRecord(record);
        assertNotNull(saved);
        verify(repository).save(record);
    }

    @Test
    void saveRecord_shouldThrowWhenTitleMissing() {
        RiskRecord record = sampleRecord();
        record.setTitle("");
        assertThrows(IllegalArgumentException.class,
                () -> service.saveRecord(record));
    }

    @Test
    void saveRecord_shouldThrowWhenCategoryMissing() {
        RiskRecord record = sampleRecord();
        record.setCategory("");
        assertThrows(IllegalArgumentException.class,
                () -> service.saveRecord(record));
    }

    @Test
    void getRecordById_shouldReturnRecord() {
        RiskRecord record = sampleRecord();
        when(repository.findById(1L)).thenReturn(Optional.of(record));
        RiskRecord result = service.getRecordById(1L);
        assertEquals(1L, result.getId());
    }

    @Test
    void getRecordById_shouldThrowWhenNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.getRecordById(99L));
    }

    @Test
    void getByStatus_shouldReturnRecords() {
        when(repository.findByStatusAndDeletedFalse("OPEN"))
                .thenReturn(List.of(sampleRecord()));
        List<RiskRecord> list = service.getByStatus("OPEN");
        assertEquals(1, list.size());
    }

    @Test
    void getByCategory_shouldReturnRecords() {
        when(repository.findByCategoryAndDeletedFalse("Infrastructure"))
                .thenReturn(List.of(sampleRecord()));
        List<RiskRecord> list = service.getByCategory("Infrastructure");
        assertEquals(1, list.size());
    }

    @Test
    void deleteRecord_shouldDeleteSuccessfully() {
        RiskRecord record = sampleRecord();
        when(repository.findById(1L)).thenReturn(Optional.of(record));
        service.deleteRecord(1L);
        verify(repository).save(any(RiskRecord.class));
    }

    @Test
    void deleteRecord_shouldThrowWhenNotFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.deleteRecord(1L));
    }
}