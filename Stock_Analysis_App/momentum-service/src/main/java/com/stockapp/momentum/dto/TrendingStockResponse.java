package com.stockapp.momentum.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TrendingStockResponse(
        String symbol,
        String stockName,
        String sectorName,
        BigDecimal latestScore,
        LocalDate latestDate,
        List<DailyScore> dailyScores,
        BigDecimal scoreChange
) {}
