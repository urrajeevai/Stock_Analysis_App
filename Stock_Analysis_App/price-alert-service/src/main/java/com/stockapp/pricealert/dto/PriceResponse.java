package com.stockapp.pricealert.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceResponse(
        String ticker,
        BigDecimal price,
        Instant fetchedAt
) {}
