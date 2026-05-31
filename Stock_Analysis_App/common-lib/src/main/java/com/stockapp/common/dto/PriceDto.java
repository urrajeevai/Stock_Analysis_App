package com.stockapp.common.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceDto(String ticker, BigDecimal price, Instant fetchedAt) {}
