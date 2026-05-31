package com.stockapp.rsi.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyRsiScore(
        LocalDate date,
        BigDecimal rsiScore
) {}
