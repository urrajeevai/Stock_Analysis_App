package com.stockapp.rsi.dto;

import java.time.LocalDate;
import java.util.List;

public record RsiUploadResult(
        Long uploadId,
        String fileName,
        LocalDate scoreDate,
        int inserted,
        int updated,
        int failed,
        int total,
        List<String> errors
) {}
