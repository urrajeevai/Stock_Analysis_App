package com.stockapp.pricealert.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AlertResponse(
        UUID id,
        UUID tradeId,
        UUID userId,
        String ticker,
        String alertType,
        BigDecimal thresholdPct,
        BigDecimal priceAtTrigger,
        Instant triggeredAt,
        boolean acknowledged
) {}
