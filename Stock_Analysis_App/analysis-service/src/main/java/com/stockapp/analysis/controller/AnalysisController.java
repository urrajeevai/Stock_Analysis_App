package com.stockapp.analysis.controller;

import com.stockapp.analysis.dto.*;
import com.stockapp.analysis.service.AnalysisService;
import com.stockapp.common.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/analyses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AnalysisController {

    private final AnalysisService analysisService;

    @Value("${app.pagination.analysis.page-size:20}")
    private int defaultPageSize;

    private static final int MIN_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    /** Maps API sort_by values to JPA entity field names. */
    private static final Map<String, String> SORT_FIELD_MAP = Map.of(
            "created_at",    "createdAt",
            "analysis_date", "analysisDate",
            "ticker",        "ticker",
            "outcome",       "outcome",
            "rr_ratio",      "rrRatio"
    );

    @PostMapping
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    public ResponseEntity<AnalysisResponse> createAnalysis(
            @Valid @RequestBody AnalysisCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(analysisService.createAnalysis(currentUser.getId(), request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<Page<AnalysisResponse>> listAnalyses(
            @RequestParam(required = false) String outcome,
            @RequestParam(required = false) String ticker,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", required = false) Integer pageSize,
            @RequestParam(name = "sort_by", defaultValue = "created_at") String sortBy,
            @RequestParam(name = "sort_order", defaultValue = "desc") String sortOrder,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        int effectiveSize = resolvePageSize(pageSize);
        int zeroBasedPage = Math.max(0, page - 1);
        Sort.Direction direction = "asc".equalsIgnoreCase(sortOrder)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = SORT_FIELD_MAP.getOrDefault(sortBy, "createdAt");
        Pageable pageable = PageRequest.of(zeroBasedPage, effectiveSize,
                Sort.by(direction, sortField));

        return ResponseEntity.ok(
                analysisService.listAnalyses(currentUser.getId(), outcome, ticker, pageable));
    }

    private int resolvePageSize(Integer requested) {
        if (requested == null) return defaultPageSize;
        if (requested < MIN_PAGE_SIZE) return MIN_PAGE_SIZE;
        if (requested > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
        return requested;
    }

    @GetMapping("/setup-stats")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<SetupStatsResponse>> getSetupStats(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(analysisService.getSetupStats(currentUser.getId()));
    }

    @GetMapping("/ticker-stats")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<Map<String, Object>>> getTickerStats(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(analysisService.getTickerStats(currentUser.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<AnalysisResponse> getAnalysis(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(analysisService.getAnalysis(id, currentUser.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    public ResponseEntity<AnalysisResponse> updateAnalysis(
            @PathVariable UUID id,
            @Valid @RequestBody AnalysisUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                analysisService.updateAnalysis(id, currentUser.getId(), request));
    }

    @PatchMapping("/{id}/outcome")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    public ResponseEntity<AnalysisResponse> setOutcome(
            @PathVariable UUID id,
            @Valid @RequestBody SetOutcomeRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                analysisService.setOutcome(id, currentUser.getId(), request.outcome()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAnalysis(@PathVariable UUID id) {
        analysisService.deleteAnalysis(id);
        return ResponseEntity.noContent().build();
    }

    // ── Image endpoints ───────────────────────────────────────────────────────

    @PostMapping(value = "/{id}/images/{slot}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    public ResponseEntity<AnalysisResponse> uploadImage(
            @PathVariable UUID id,
            @PathVariable int slot,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                analysisService.uploadImage(id, currentUser.getId(), slot, file));
    }

    @DeleteMapping("/{id}/images/{slot}")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    public ResponseEntity<AnalysisResponse> deleteImage(
            @PathVariable UUID id,
            @PathVariable int slot,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                analysisService.deleteImage(id, currentUser.getId(), slot));
    }
}
