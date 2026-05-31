package com.stockapp.pricealert.service;

import com.stockapp.pricealert.entity.Alert;
import com.stockapp.pricealert.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(AlertEvaluationService.class);

    private static final String SL_PROXIMITY = "SL_PROXIMITY";
    private static final String TARGET_PROXIMITY = "TARGET_PROXIMITY";

    private final AlertRepository alertRepository;

    /**
     * Evaluates whether the current price is within thresholdPct of stop-loss or target.
     * Creates an unacknowledged alert if proximity condition is met and no existing unacknowledged
     * alert of the same type exists for this trade (dedup guard).
     *
     * LONG trades:
     *   SL proximity  : price is within thresholdPct above the stop-loss  → (currentPrice - sl) / sl * 100 <= thresholdPct
     *   Target proximity: price is within thresholdPct below the target    → (target - currentPrice) / target * 100 <= thresholdPct
     *
     * SHORT trades:
     *   SL proximity  : price is within thresholdPct below the stop-loss  → (sl - currentPrice) / sl * 100 <= thresholdPct
     *   Target proximity: price is within thresholdPct above the target    → (currentPrice - target) / target * 100 <= thresholdPct
     */
    @Transactional
    public void evaluate(UUID tradeId,
                         UUID userId,
                         String ticker,
                         String direction,
                         BigDecimal stopLoss,
                         BigDecimal targetPrice,
                         BigDecimal currentPrice,
                         double thresholdPct) {

        if (stopLoss == null || targetPrice == null || currentPrice == null) {
            log.debug("Skipping evaluation for trade {} — null price data", tradeId);
            return;
        }

        BigDecimal threshold = BigDecimal.valueOf(thresholdPct);
        boolean isLong = "LONG".equalsIgnoreCase(direction);

        // --- Stop-loss proximity check ---
        BigDecimal slProximityPct = computeSlProximityPct(isLong, currentPrice, stopLoss);
        if (slProximityPct != null && slProximityPct.compareTo(threshold) <= 0
                && slProximityPct.compareTo(BigDecimal.ZERO) >= 0) {
            createAlertIfAbsent(tradeId, userId, ticker, SL_PROXIMITY, threshold, currentPrice);
        }

        // --- Target proximity check ---
        BigDecimal targetProximityPct = computeTargetProximityPct(isLong, currentPrice, targetPrice);
        if (targetProximityPct != null && targetProximityPct.compareTo(threshold) <= 0
                && targetProximityPct.compareTo(BigDecimal.ZERO) >= 0) {
            createAlertIfAbsent(tradeId, userId, ticker, TARGET_PROXIMITY, threshold, currentPrice);
        }
    }

    /**
     * Computes how close the current price is to the stop-loss as a percentage.
     * Returns null if the stop-loss is zero (avoid division by zero).
     * For LONG: (currentPrice - sl) / sl * 100  — positive means above sl
     * For SHORT: (sl - currentPrice) / sl * 100  — positive means below sl
     */
    private BigDecimal computeSlProximityPct(boolean isLong, BigDecimal currentPrice, BigDecimal stopLoss) {
        if (stopLoss.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        BigDecimal diff = isLong
                ? currentPrice.subtract(stopLoss)
                : stopLoss.subtract(currentPrice);
        return diff.divide(stopLoss, 6, RoundingMode.HALF_UP)
                   .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Computes how close the current price is to the target as a percentage.
     * Returns null if the target is zero (avoid division by zero).
     * For LONG: (target - currentPrice) / target * 100  — positive means below target
     * For SHORT: (currentPrice - target) / target * 100  — positive means above target
     */
    private BigDecimal computeTargetProximityPct(boolean isLong, BigDecimal currentPrice, BigDecimal targetPrice) {
        if (targetPrice.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        BigDecimal diff = isLong
                ? targetPrice.subtract(currentPrice)
                : currentPrice.subtract(targetPrice);
        return diff.divide(targetPrice, 6, RoundingMode.HALF_UP)
                   .multiply(BigDecimal.valueOf(100));
    }

    private void createAlertIfAbsent(UUID tradeId, UUID userId, String ticker,
                                      String alertType, BigDecimal thresholdPct,
                                      BigDecimal currentPrice) {
        boolean alreadyExists = alertRepository
                .existsByTradeIdAndAlertTypeAndAcknowledgedFalse(tradeId, alertType);
        if (alreadyExists) {
            log.debug("Skipping duplicate alert {} for trade {}", alertType, tradeId);
            return;
        }

        Alert alert = new Alert();
        alert.setTradeId(tradeId);
        alert.setUserId(userId);
        alert.setTicker(ticker);
        alert.setAlertType(alertType);
        alert.setThresholdPct(thresholdPct);
        alert.setPriceAtTrigger(currentPrice);
        alert.setAcknowledged(false);

        alertRepository.save(alert);
        log.info("Created {} alert for trade {} (ticker={}, price={})", alertType, tradeId, ticker, currentPrice);
    }
}
