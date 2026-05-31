package com.stockapp.trade.dto;

import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TradeUpdateRequest(
        @Positive(message = "Stop loss must be positive")
        BigDecimal stopLoss,

        @Positive(message = "Target price must be positive")
        BigDecimal targetPrice,

        @Positive(message = "Quantity must be positive")
        BigDecimal quantity,

        String notes,

        String setupType,

        String reason
) {
}
