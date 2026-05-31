package com.stockapp.trade.dto;

import java.time.Instant;
import java.util.UUID;

public record RevisionResponse(
        UUID id,
        String fieldChanged,
        String oldValue,
        String newValue,
        Instant revisedAt,
        String reason
) {
}
