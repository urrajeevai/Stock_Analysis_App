package com.stockapp.trade.dto;

import java.util.List;

public record CsvUploadResult(
        int inserted,
        int updated,
        int failed,
        int total,
        List<String> errors
) {}
