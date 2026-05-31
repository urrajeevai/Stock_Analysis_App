package com.stockapp.momentum.controller;

import com.stockapp.common.security.UserPrincipal;
import com.stockapp.momentum.dto.*;
import com.stockapp.momentum.service.MomentumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
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
@RequestMapping("/momentum")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Momentum", description = "Momentum score CSV upload, browsing, and trending analysis")
@SecurityRequirement(name = "bearerAuth")
public class MomentumController {

    private final MomentumService momentumService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'TRADER')")
    @Operation(
        summary = "Upload momentum scores CSV",
        description = "Columns required: Stock Name, Symbol, Score. " +
                      "Optional: Sector Name. All other columns are ignored. " +
                      "Upserts by (symbol + scoreDate). Exchange defaults to NSE for new stocks."
    )
    public ResponseEntity<MomentumUploadResult> uploadCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "scoreDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate scoreDate,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(momentumService.uploadCsv(file, scoreDate, currentUser.getId()));
    }

    @GetMapping("/scores")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Browse momentum scores with optional filters")
    public ResponseEntity<Page<MomentumScoreResponse>> listScores(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Integer lastNDays,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String symbol,
            @PageableDefault(size = 50, sort = "scoreDate") Pageable pageable,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                momentumService.listScores(dateFrom, dateTo, lastNDays, sector, symbol, pageable));
    }

    @GetMapping("/trending")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(
        summary = "Get trending stocks",
        description = "Returns stocks with score ≥ minScore on every score date in the selected " +
                      "window, with strictly increasing scores day-over-day. " +
                      "Supply dateFrom + dateTo for a fixed date range, or just lastNDays for a " +
                      "rolling window of the last N dates that have data. " +
                      "dateFrom + dateTo takes precedence when both are present."
    )
    public ResponseEntity<List<TrendingStockResponse>> getTrending(
            @RequestParam(defaultValue = "3") int lastNDays,
            @RequestParam(defaultValue = "60") BigDecimal minScore,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(momentumService.getTrendingStocks(lastNDays, minScore, dateFrom, dateTo));
    }

    @GetMapping(value = "/trending/export", produces = "text/csv")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(
        summary = "Export trending stocks as CSV",
        description = "Accepts the same filters as /trending and returns the result as a " +
                      "downloadable CSV file. Rows are in default score-change descending order."
    )
    public ResponseEntity<String> exportTrendingCsv(
            @RequestParam(defaultValue = "3") int lastNDays,
            @RequestParam(defaultValue = "60") BigDecimal minScore,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<TrendingStockResponse> stocks =
                momentumService.getTrendingStocks(lastNDays, minScore, dateFrom, dateTo);

        String filename = "trending_stocks_" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(buildTrendingCsv(stocks));
    }

    /** Builds a CSV string from a list of TrendingStockResponse objects. */
    private String buildTrendingCsv(List<TrendingStockResponse> stocks) {
        if (stocks.isEmpty()) {
            return "#,Symbol,Stock Name,Sector,Change\r\n";
        }

        StringBuilder sb = new StringBuilder();

        // Header — dynamic Day columns derived from first row
        List<DailyScore> sample = stocks.get(0).dailyScores();
        sb.append("#,Symbol,Stock Name,Sector");
        for (int i = 0; i < sample.size(); i++) {
            sb.append(",Day ").append(i + 1).append(" (").append(sample.get(i).date()).append(")");
        }
        sb.append(",Change\r\n");

        // Rows
        for (int i = 0; i < stocks.size(); i++) {
            TrendingStockResponse s = stocks.get(i);
            sb.append(i + 1).append(',')
              .append(csvEscape(s.symbol())).append(',')
              .append(csvEscape(s.stockName())).append(',')
              .append(csvEscape(s.sectorName() != null ? s.sectorName() : ""));
            for (DailyScore ds : s.dailyScores()) {
                sb.append(',').append(ds.score().toPlainString());
            }
            sb.append(",+").append(s.scoreChange().toPlainString()).append("\r\n");
        }
        return sb.toString();
    }

    private static String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    @GetMapping("/uploads")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "List all CSV upload sessions")
    public ResponseEntity<List<MomentumUploadSummary>> listUploads(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(momentumService.listUploads());
    }

    @GetMapping("/dates")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get all distinct score dates available")
    public ResponseEntity<List<LocalDate>> getAvailableDates(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(momentumService.getAvailableDates());
    }

    @GetMapping("/sectors")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get all distinct sectors")
    public ResponseEntity<List<String>> getSectors(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(momentumService.getAvailableSectors());
    }
}
