package com.internship.backend.repository;

import com.internship.backend.entity.RiskRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskRecordRepository extends JpaRepository<RiskRecord, Long> {

    List<RiskRecord> findByStatus(String status);

    List<RiskRecord> findByCategory(String category);
}