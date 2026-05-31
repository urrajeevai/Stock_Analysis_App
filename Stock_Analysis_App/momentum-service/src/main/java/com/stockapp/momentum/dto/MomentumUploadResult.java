package com.stockapp.momentum.dto;

import java.time.LocalDate;
import java.util.List;

public record MomentumUploadResult(
        Long uploadId,
        String fileName,
        LocalDate scoreDate,
        int inserted,
        int updated,
        int failed,
        int total,
        List<String> errors
) {}
