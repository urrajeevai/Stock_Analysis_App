package com.stockapp.performance.dto;

import java.math.BigDecimal;

public record PerformanceSummaryResponse(
        int totalTrades,
        int winCount,
        int lossCount,
        int breakevenCount,
        BigDecimal strikeRate,
        BigDecimal avgRR,
        BigDecimal avgWinRR,
        BigDecimal avgLossRR,
        String bestSetupType,
        int openTrades
) {}
