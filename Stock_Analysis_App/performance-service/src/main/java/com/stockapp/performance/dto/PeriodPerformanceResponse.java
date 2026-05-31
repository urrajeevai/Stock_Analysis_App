package com.stockapp.performance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PeriodPerformanceResponse(
        LocalDate periodStart,
        LocalDate periodEnd,
        String periodType,
        int winCount,
        int lossCount,
        int totalTrades,
        BigDecimal strikeRate,
        BigDecimal avgRR,
        BigDecimal totalPL,
        BigDecimal totalProfitAmount,
        BigDecimal totalLossAmount
) {}
