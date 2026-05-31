package com.stockapp.rsi.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RsiScoreResponse(
        Long id,
        String symbol,
        String stockName,
        String sectorName,
        BigDecimal rsiScore,
        LocalDate scoreDate,
        Long uploadId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
