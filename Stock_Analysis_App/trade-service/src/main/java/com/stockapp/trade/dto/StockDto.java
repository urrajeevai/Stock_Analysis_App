package com.stockapp.trade.dto;

import java.time.LocalDateTime;

public record StockDto(
        Long stockId,
        String name,
        String symbol,
        String exchange,
        String industry,
        String series,
        String isinCode,
        boolean active,
        LocalDateTime createdTime,
        LocalDateTime updatedTime
) {}
