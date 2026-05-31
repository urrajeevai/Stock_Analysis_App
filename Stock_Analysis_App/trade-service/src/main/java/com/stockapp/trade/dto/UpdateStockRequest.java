package com.stockapp.trade.dto;

public record UpdateStockRequest(
        String name,
        String symbol,
        String exchange,
        String industry,
        String series,
        String isinCode,
        Boolean active
) {}
