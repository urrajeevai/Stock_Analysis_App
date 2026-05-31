package com.stockapp.trade.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TradeTrailResponse(
        UUID id,
        UUID tradeId,
        BigDecimal previousStopLoss,
        BigDecimal newStopLoss,
        BigDecimal previousTarget,
        BigDecimal newTarget,
        String reason,
        String notes,
        Instant createdAt
) {}
