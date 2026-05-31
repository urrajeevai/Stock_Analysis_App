package com.stockapp.momentum.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MomentumScoreResponse(
        Long id,
        String symbol,
        String stockName,
        String sectorName,
        BigDecimal score,
        LocalDate scoreDate,
        Long uploadId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
