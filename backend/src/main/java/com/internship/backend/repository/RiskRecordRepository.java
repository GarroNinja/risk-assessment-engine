package com.internship.backend.repository;

import com.internship.backend.entity.RiskRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RiskRecordRepository extends JpaRepository<RiskRecord, Long> {

    List<RiskRecord> findByStatusAndDeletedFalse(String status);

    List<RiskRecord> findByCategoryAndDeletedFalse(String category);

    Page<RiskRecord> findByDeletedFalse(Pageable pageable);

    @Query("""
           SELECT r FROM RiskRecord r
           WHERE r.deleted = false
             AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(r.description) LIKE LOWER(CONCAT('%', :q, '%')))
           """)
    Page<RiskRecord> searchByKeyword(@Param("q") String keyword, Pageable pageable);

    @Query("""
           SELECT r FROM RiskRecord r
           WHERE r.deleted = false
             AND r.createdAt BETWEEN :from AND :to
           """)
    List<RiskRecord> findByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    long countByDeletedFalse();

    long countByStatusAndDeletedFalse(String status);

    long countByCategoryAndDeletedFalse(String category);

    @Query("SELECT AVG(r.riskScore) FROM RiskRecord r WHERE r.deleted = false")
    Double averageRiskScore();

    @Query("""
           SELECT r FROM RiskRecord r
           WHERE r.deleted = false
             AND r.status = 'OPEN'
             AND r.riskScore >= 70
           """)
    List<RiskRecord> findHighScoreOpenRisks();

    List<RiskRecord> findByDeletedFalseOrderByCreatedAtDesc();
}