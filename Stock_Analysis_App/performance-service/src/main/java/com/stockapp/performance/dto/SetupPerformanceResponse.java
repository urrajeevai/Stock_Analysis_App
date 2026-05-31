package com.stockapp.performance.dto;

import java.math.BigDecimal;

public record SetupPerformanceResponse(
        String setupType,
        int totalTrades,
        int winCount,
        int lossCount,
        BigDecimal strikeRate,
        BigDecimal avgRR
) {}
