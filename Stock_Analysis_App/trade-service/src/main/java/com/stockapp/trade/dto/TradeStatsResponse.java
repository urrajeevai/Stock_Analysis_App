package com.stockapp.trade.dto;

public record TradeStatsResponse(
        long openCount,
        long closedCount,
        long cancelledCount,
        long totalCount
) {
}
