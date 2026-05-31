package com.stockapp.momentum.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MomentumUploadSummary(
        Long id,
        String fileName,
        LocalDate scoreDate,
        LocalDateTime uploadedAt,
        int inserted,
        int updated,
        int failed,
        int total
) {}
