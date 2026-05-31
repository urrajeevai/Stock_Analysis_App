package com.stockapp.trade.controller;

import com.stockapp.trade.dto.TradeResponse;
import com.stockapp.trade.service.TradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Internal endpoints for service-to-service communication.
 * Protected by X-Internal-Token header — not by JWT.
 */
@RestController
@RequestMapping("/trades/internal")
@RequiredArgsConstructor
public class TradeInternalController {

    private final TradeService tradeService;

    @Value("${internal.token:internal-default-token-change-me}")
    private String internalToken;

    private boolean isAuthorized(String token) {
        return internalToken.equals(token);
    }

    @GetMapping("/by-user")
    public ResponseEntity<List<TradeResponse>> getTradesByUser(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @RequestParam String userId,
            @RequestParam(required = false) String status) {
        if (!isAuthorized(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<TradeResponse> trades = tradeService.listTrades(
                UUID.fromString(userId), status, null, Pageable.unpaged()
        ).getContent();
        return ResponseEntity.ok(trades);
    }

    @GetMapping("/open-all")
    public ResponseEntity<List<TradeResponse>> getAllOpenTrades(
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        if (!isAuthorized(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(tradeService.getOpenTrades());
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> countTrades(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @RequestParam String userId,
            @RequestParam(required = false) String status) {
        if (!isAuthorized(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        long count = tradeService.countTrades(UUID.fromString(userId), status);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
