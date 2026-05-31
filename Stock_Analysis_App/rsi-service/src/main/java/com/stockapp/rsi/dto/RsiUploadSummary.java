package com.stockapp.rsi.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RsiUploadSummary(
        Long id,
        String fileName,
        LocalDate scoreDate,
        LocalDateTime uploadedAt,
        int inserted,
        int updated,
        int failed,
        int total
) {}
