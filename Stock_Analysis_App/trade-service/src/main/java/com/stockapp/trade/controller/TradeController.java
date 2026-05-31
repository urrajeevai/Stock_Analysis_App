package com.stockapp.trade.controller;

import com.stockapp.common.security.UserPrincipal;
import com.stockapp.trade.dto.*;
import com.stockapp.trade.service.TradeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trades")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Trades", description = "Trade lifecycle: create, update, close, cancel, revision history, and trail entries")
@SecurityRequirement(name = "bearerAuth")
public class TradeController {

    private final TradeService tradeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    @Operation(summary = "Create a new trade")
    public ResponseEntity<TradeResponse> createTrade(
            @Valid @RequestBody TradeCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tradeService.createTrade(currentUser.getId(), request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "List trades with optional status/ticker filter")
    public ResponseEntity<Page<TradeResponse>> listTrades(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String ticker,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.listTrades(currentUser.getId(), status, ticker, pageable));
    }

    @GetMapping("/open")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get all open trades for current user")
    public ResponseEntity<List<TradeResponse>> getOpenTrades(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.listTrades(
                currentUser.getId(), "OPEN", null, Pageable.unpaged()).getContent());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    @Operation(summary = "Get trade count stats by status")
    public ResponseEntity<TradeStatsResponse> getStats(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.getStats(currentUser.getId()));
    }

    @GetMapping("/by-analysis/{analysisId}")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get trades linked to a specific analysis")
    public ResponseEntity<List<TradeResponse>> getTradesByAnalysis(
            @PathVariable UUID analysisId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.getTradesByAnalysis(analysisId, currentUser.getId()));
    }

    @GetMapping("/pl-summary")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "P/L summary: all-time trade counts + last-1-month profit/loss/net amounts")
    public ResponseEntity<PLSummaryResponse> getPLSummary(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.getPLSummary(currentUser.getId()));
    }

    @GetMapping("/pl-detail")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Closed trades with P/L, filterable by months, type (PROFIT/LOSS/ALL), ticker, direction")
    public ResponseEntity<List<TradeResponse>> getPLDetail(
            @RequestParam(defaultValue = "1") int months,
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(required = false) String ticker,
            @RequestParam(required = false) String direction,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.getPLDetail(currentUser.getId(), months, type, ticker, direction));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get trade by ID")
    public ResponseEntity<TradeResponse> getTrade(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.getTrade(id, currentUser.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    @Operation(summary = "Update trade SL/target/notes — every change is recorded in revision history")
    public ResponseEntity<TradeResponse> updateTrade(
            @PathVariable UUID id,
            @Valid @RequestBody TradeUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.updateTrade(id, currentUser.getId(), request));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    @Operation(summary = "Close a trade with exit price and outcome (WIN/LOSS/BREAKEVEN)")
    public ResponseEntity<TradeResponse> closeTrade(
            @PathVariable UUID id,
            @Valid @RequestBody CloseTradeRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.closeTrade(id, currentUser.getId(), request));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    @Operation(summary = "Cancel an open trade")
    public ResponseEntity<Void> cancelTrade(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        tradeService.cancelTrade(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hard-delete a trade (Admin only)")
    public ResponseEntity<Void> deleteTrade(@PathVariable UUID id) {
        tradeService.deleteTrade(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/revisions")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get full revision history for a trade")
    public ResponseEntity<List<RevisionResponse>> getRevisions(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.getRevisions(id, currentUser.getId()));
    }

    @PostMapping("/{id}/trails")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    @Operation(summary = "Add a trail entry (trailing SL or target update) — never overwrites, always appends")
    public ResponseEntity<TradeTrailResponse> addTrailEntry(
            @PathVariable UUID id,
            @RequestBody TradeTrailCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tradeService.addTrailEntry(id, currentUser.getId(), request));
    }

    @GetMapping("/{id}/trails")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get all trail entries for a trade in chronological order")
    public ResponseEntity<List<TradeTrailResponse>> getTrailEntries(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(tradeService.getTrailEntries(id, currentUser.getId()));
    }
}
