package com.stockapp.analysis.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AnalysisResponse(
        UUID id,
        UUID userId,
        Long stockId,
        String ticker,
        String setupType,
        String thesis,
        String expectedDirection,
        String outcome,
        LocalDate analysisDate,

        // Price levels
        BigDecimal stockPrice,
        BigDecimal riskPrice,
        BigDecimal rewardPrice,
        String timeframe,

        // Computed R/R fields
        BigDecimal riskAmount,
        BigDecimal rewardAmount,
        BigDecimal riskPercent,
        BigDecimal rewardPercent,
        BigDecimal rrRatio,
        String buyDecision,

        // Chart image URLs (relative, served via /api/analyses/images/...)
        String chartImage1Url,
        String chartImage2Url,
        String chartImage3Url,
        String chartImage4Url,

        Instant createdAt,
        Instant updatedAt
) {
}
