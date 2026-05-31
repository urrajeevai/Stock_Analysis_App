package com.stockapp.rsi.controller;

import com.stockapp.common.security.UserPrincipal;
import com.stockapp.rsi.dto.*;
import com.stockapp.rsi.service.RsiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/rsi")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "RSI", description = "RSI score CSV upload, browsing, and trending analysis")
@SecurityRequirement(name = "bearerAuth")
public class RsiController {

    private final RsiService rsiService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'TRADER')")
    @Operation(
        summary = "Upload RSI scores CSV",
        description = "Required columns: Stock Name, Symbol, RSI. " +
                      "Optional: Sector Name. All other columns (Exch, Industry Name, Prev. RSI, etc.) are ignored. " +
                      "Upserts by (symbol + scoreDate)."
    )
    public ResponseEntity<RsiUploadResult> uploadCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "scoreDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate scoreDate,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(rsiService.uploadCsv(file, scoreDate, currentUser.getId()));
    }

    @GetMapping("/scores")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Browse RSI scores with optional filters")
    public ResponseEntity<Page<RsiScoreResponse>> listScores(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Integer lastNDays,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String symbol,
            @PageableDefault(size = 50, sort = "scoreDate") Pageable pageable,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                rsiService.listScores(dateFrom, dateTo, lastNDays, sector, symbol, pageable));
    }

    @GetMapping("/trending")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(
        summary = "Get RSI trending stocks",
        description = "Returns stocks with RSI >= minRsi on every date in the selected window, " +
                      "with strictly increasing RSI day-over-day. " +
                      "Supply dateFrom + dateTo for a fixed date range, or lastNDays for a rolling window. " +
                      "dateFrom + dateTo takes precedence when both are present."
    )
    public ResponseEntity<List<TrendingRsiStockResponse>> getTrending(
            @RequestParam(defaultValue = "3") int lastNDays,
            @RequestParam(defaultValue = "50") BigDecimal minRsi,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(rsiService.getTrendingStocks(lastNDays, minRsi, dateFrom, dateTo));
    }

    @GetMapping("/uploads")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "List all RSI CSV upload sessions")
    public ResponseEntity<List<RsiUploadSummary>> listUploads(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(rsiService.listUploads());
    }

    @GetMapping("/dates")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get all distinct RSI score dates available")
    public ResponseEntity<List<LocalDate>> getAvailableDates(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(rsiService.getAvailableDates());
    }

    @GetMapping("/sectors")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get all distinct sectors")
    public ResponseEntity<List<String>> getSectors(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(rsiService.getAvailableSectors());
    }
}
