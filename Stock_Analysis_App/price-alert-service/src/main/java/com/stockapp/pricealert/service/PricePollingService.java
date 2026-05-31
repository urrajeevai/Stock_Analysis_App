package com.stockapp.pricealert.service;

import com.stockapp.pricealert.client.TradeServiceClient;
import com.stockapp.pricealert.client.YahooFinanceClient;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PricePollingService {

    private static final Logger log = LoggerFactory.getLogger(PricePollingService.class);

    private final TradeServiceClient tradeServiceClient;
    private final YahooFinanceClient yahooFinanceClient;
    private final AlertEvaluationService alertEvaluationService;

    @Value("${price-polling.alert-threshold-pct:2.0}")
    private double alertThresholdPct;

    /**
     * Scheduled polling task. Runs at the fixed delay specified in configuration (default 60 s).
     * Steps:
     *   1. Fetch all open trades from the trade-service.
     *   2. Deduplicate tickers so we call Yahoo Finance once per ticker.
     *   3. Fetch current price for each unique ticker.
     *   4. For each trade, invoke AlertEvaluationService to check proximity.
     */
    @Scheduled(fixedDelayString = "${price-polling.interval-ms:60000}")
    public void pollPrices() {
        log.debug("Starting price-polling cycle");

        List<Map<String, Object>> openTrades = tradeServiceClient.getOpenTrades();
        if (openTrades.isEmpty()) {
            log.debug("No open trades to evaluate");
            return;
        }

        // Build ticker → price map (one Yahoo Finance call per unique ticker)
        Map<String, BigDecimal> priceCache = new HashMap<>();
        for (Map<String, Object> trade : openTrades) {
            String ticker = (String) trade.get("ticker");
            if (ticker != null && !priceCache.containsKey(ticker)) {
                BigDecimal price = yahooFinanceClient.getPrice(ticker);
                priceCache.put(ticker, price);
                if (price != null) {
                    log.debug("Fetched price for {}: {}", ticker, price);
                } else {
                    log.warn("Could not fetch price for ticker: {}", ticker);
                }
            }
        }

        // Evaluate each trade
        for (Map<String, Object> trade : openTrades) {
            try {
                String idStr    = trade.get("id") != null ? trade.get("id").toString() : null;
                String userStr  = trade.get("userId") != null ? trade.get("userId").toString() : null;
                String ticker   = (String) trade.get("ticker");
                String direction = trade.get("direction") != null ? trade.get("direction").toString() : "LONG";

                if (idStr == null || userStr == null || ticker == null) {
                    log.warn("Skipping trade with missing required fields: {}", trade);
                    continue;
                }

                UUID tradeId = UUID.fromString(idStr);
                UUID userId  = UUID.fromString(userStr);

                BigDecimal stopLoss    = toBigDecimal(trade.get("stopLoss"));
                BigDecimal targetPrice = toBigDecimal(trade.get("targetPrice"));
                BigDecimal currentPrice = priceCache.get(ticker);

                if (currentPrice == null) {
                    continue; // price unavailable — skip
                }

                alertEvaluationService.evaluate(
                        tradeId, userId, ticker, direction,
                        stopLoss, targetPrice, currentPrice,
                        alertThresholdPct);

            } catch (Exception e) {
                log.error("Error evaluating trade {}: {}", trade.get("id"), e.getMessage());
            }
        }

        log.debug("Price-polling cycle complete. Evaluated {} trades.", openTrades.size());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
