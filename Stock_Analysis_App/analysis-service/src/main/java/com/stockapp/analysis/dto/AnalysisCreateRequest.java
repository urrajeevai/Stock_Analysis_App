package com.stockapp.analysis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AnalysisCreateRequest(
        @NotBlank(message = "Ticker is required")
        String ticker,

        Long stockId,

        String setupType,

        String thesis,

        String expectedDirection,

        @NotNull(message = "Analysis date is required")
        LocalDate analysisDate,

        BigDecimal stockPrice,

        BigDecimal riskPrice,

        BigDecimal rewardPrice,

        String timeframe
) {
}
