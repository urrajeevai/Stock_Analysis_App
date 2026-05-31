package com.stockapp.analysis.dto;

import jakarta.validation.constraints.NotBlank;

public record SetOutcomeRequest(
        @NotBlank(message = "Outcome is required")
        String outcome
) {
}
