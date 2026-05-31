package com.stockapp.rsi.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TrendingRsiStockResponse(
        String symbol,
        String stockName,
        String sectorName,
        BigDecimal latestRsi,
        LocalDate latestDate,
        List<DailyRsiScore> dailyScores,
        BigDecimal rsiChange
) {}
