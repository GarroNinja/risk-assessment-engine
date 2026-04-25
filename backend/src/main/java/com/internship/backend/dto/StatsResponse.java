package com.internship.backend.dto;

import lombok.Builder;
import lombok.Data;

/** Returned by GET /api/risk-records/stats for dashboard KPI cards */
@Data
@Builder
public class StatsResponse {
    private long total;
    private long openCount;
    private long inProgressCount;
    private long closedCount;
    private Double averageRiskScore;
    private long highRiskCount;          // score >= 70
}
