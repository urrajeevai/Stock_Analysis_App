package com.stockapp.trade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record TradeCreateRequest(
        @NotBlank(message = "Ticker is required")
        String ticker,

        Long stockId,

        String direction,

        @NotNull(message = "Entry price is required")
        @Positive(message = "Entry price must be positive")
        BigDecimal entryPrice,

        @NotNull(message = "Stop loss is required")
        @Positive(message = "Stop loss must be positive")
        BigDecimal stopLoss,

        @NotNull(message = "Target price is required")
        @Positive(message = "Target price must be positive")
        BigDecimal targetPrice,

        @Positive(message = "Quantity must be positive")
        BigDecimal quantity,

        String setupType,

        String notes,

        UUID analysisId
) {}
