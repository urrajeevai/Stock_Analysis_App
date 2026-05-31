package com.stockapp.trade.dto;

import java.math.BigDecimal;

public record TradeTrailCreateRequest(
        BigDecimal newStopLoss,
        BigDecimal newTarget,
        String reason,
        String notes
) {}
