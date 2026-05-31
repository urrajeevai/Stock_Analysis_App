package com.stockapp.momentum.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyScore(
        LocalDate date,
        BigDecimal score
) {}
