package com.stockapp.trade.controller;

import com.stockapp.trade.dto.TradeResponse;
import com.stockapp.trade.service.TradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Internal endpoints for service-to-service communication.
 * These are permitted without JWT auth in SecurityConfig.
 * Callers must include X-Internal-Request header to identify themselves.
 */
@RestController
@RequestMapping("/trades/internal")
@RequiredArgsConstructor
public class TradeInternalController {

    private final TradeService tradeService;

    @GetMapping("/by-user")
    public ResponseEntity<List<TradeResponse>> getTradesByUser(
            @RequestParam String userId,
            @RequestParam(required = false) String status) {
        List<TradeResponse> trades = tradeService.listTrades(
                UUID.fromString(userId), status, null, Pageable.unpaged()
        ).getContent();
        return ResponseEntity.ok(trades);
    }

    @GetMapping("/open-all")
    public ResponseEntity<List<TradeResponse>> getAllOpenTrades() {
        List<TradeResponse> trades = tradeService.getOpenTrades();
        return ResponseEntity.ok(trades);
    }
}
