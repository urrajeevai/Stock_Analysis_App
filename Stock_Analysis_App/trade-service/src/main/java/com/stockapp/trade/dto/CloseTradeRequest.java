package com.stockapp.trade.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CloseTradeRequest(
        @NotNull(message = "Actual exit price is required")
        @Positive(message = "Actual exit price must be positive")
        BigDecimal actualExitPrice,

        @NotNull(message = "Outcome is required")
        String outcome,

        String notes
) {
}
