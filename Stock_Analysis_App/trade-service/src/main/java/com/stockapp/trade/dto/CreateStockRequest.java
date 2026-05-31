package com.stockapp.trade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStockRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 30) String symbol,
        String exchange,
        String industry,
        String series,
        String isinCode
) {}
