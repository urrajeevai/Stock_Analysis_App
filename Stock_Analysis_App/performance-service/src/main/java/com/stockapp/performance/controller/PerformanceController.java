package com.stockapp.performance.controller;

import com.stockapp.common.security.UserPrincipal;
import com.stockapp.performance.dto.*;
import com.stockapp.performance.service.PerformanceCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/performance")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PerformanceController {

    private final PerformanceCalculationService performanceCalculationService;

    /**
     * GET /performance/summary
     * Returns overall performance summary for the authenticated user.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<PerformanceSummaryResponse> getSummary(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PerformanceSummaryResponse summary = performanceCalculationService.computeSummary(currentUser.getId());
        return ResponseEntity.ok(summary);
    }

    /**
     * GET /performance/weekly
     * Returns week-by-week breakdown of performance.
     */
    @GetMapping("/weekly")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<PeriodPerformanceResponse>> getWeekly(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PeriodPerformanceResponse> weekly = performanceCalculationService.computeWeekly(currentUser.getId());
        return ResponseEntity.ok(weekly);
    }

    /**
     * GET /performance/monthly
     * Returns month-by-month breakdown of performance.
     */
    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<PeriodPerformanceResponse>> getMonthly(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PeriodPerformanceResponse> monthly = performanceCalculationService.computeMonthly(currentUser.getId());
        return ResponseEntity.ok(monthly);
    }

    /**
     * GET /performance/period?from=2026-01-01&to=2026-05-19
     * Returns performance for a custom date range.
     */
    @GetMapping("/period")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<PeriodPerformanceResponse> getPeriodPerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PeriodPerformanceResponse result = performanceCalculationService
                .computeForPeriod(currentUser.getId(), from, to);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /performance/best-setups
     * Returns setup types ranked by win rate.
     */
    @GetMapping("/best-setups")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<SetupPerformanceResponse>> getBestSetups(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<SetupPerformanceResponse> setups = performanceCalculationService.getBestSetups(currentUser.getId());
        return ResponseEntity.ok(setups);
    }

    /**
     * GET /performance/rr-distribution
     * Returns R:R distribution bucketed into <1, 1-2, 2-3, 3+.
     */
    @GetMapping("/rr-distribution")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<RRDistributionResponse>> getRRDistribution(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<RRDistributionResponse> distribution = performanceCalculationService
                .getRRDistribution(currentUser.getId());
        return ResponseEntity.ok(distribution);
    }

    /**
     * POST /performance/recompute
     * Forces a full recomputation of all stored performance snapshots. ADMIN only.
     */
    @PostMapping("/recompute")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> recompute(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        performanceCalculationService.forceRecompute(currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
