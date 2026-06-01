package com.stockapp.trade.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TradeResponse(
        UUID id,
        UUID userId,
        Long stockId,
        String ticker,
        String direction,
        BigDecimal entryPrice,
        BigDecimal stopLoss,
        BigDecimal targetPrice,
        BigDecimal rrRatio,
        String status,
        String outcome,
        String notes,
        String setupType,
        Instant createdAt,
        Instant closedAt,
        BigDecimal actualExitPrice,
        UUID analysisId,
        BigDecimal activeStopLoss,
        BigDecimal activeTarget,
        BigDecimal quantity,
        BigDecimal totalValue,
        BigDecimal plAmount,
        BigDecimal plPercent,
        Long holdingDays
) {}
