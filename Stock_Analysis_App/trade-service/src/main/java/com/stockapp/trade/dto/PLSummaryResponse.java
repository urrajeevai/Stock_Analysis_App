package com.stockapp.trade.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PLSummaryResponse(
        long totalClosedTrades,
        long profitTradeCount,
        long lossTradeCount,
        long openTradeCount,
        BigDecimal totalProfitAmount,
        BigDecimal totalLossAmount,
        BigDecimal netPL,
        LocalDate periodStart,
        LocalDate periodEnd
) {}
