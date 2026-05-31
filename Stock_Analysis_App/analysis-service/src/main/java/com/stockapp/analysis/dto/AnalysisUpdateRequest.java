package com.stockapp.analysis.dto;

import java.math.BigDecimal;

public record AnalysisUpdateRequest(
        Long stockId,
        String setupType,
        String thesis,
        String outcome,
        String expectedDirection,
        BigDecimal stockPrice,
        BigDecimal riskPrice,
        BigDecimal rewardPrice,
        String timeframe
) {
}
