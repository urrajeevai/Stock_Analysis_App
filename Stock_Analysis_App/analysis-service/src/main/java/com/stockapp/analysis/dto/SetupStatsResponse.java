package com.stockapp.analysis.dto;

public record SetupStatsResponse(
        String setupType,
        long total,
        long correct,
        long failed,
        long pending,
        double winRate
) {
}
