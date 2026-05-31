package com.stockapp.trade.service;

import com.stockapp.common.enums.Direction;
import com.stockapp.common.enums.TradeOutcome;
import com.stockapp.common.enums.TradeStatus;
import com.stockapp.common.exception.ApiException;
import com.stockapp.common.exception.ResourceNotFoundException;
import com.stockapp.trade.dto.*;
import com.stockapp.trade.entity.Trade;
import com.stockapp.trade.entity.TradeRevision;
import com.stockapp.trade.entity.TradeTrail;
import com.stockapp.trade.repository.TradeRepository;
import com.stockapp.trade.repository.TradeRevisionRepository;
import com.stockapp.trade.repository.TradeTrailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TradeService {

    private final TradeRepository tradeRepository;
    private final TradeRevisionRepository tradeRevisionRepository;
    private final TradeTrailRepository tradeTrailRepository;

    public TradeResponse createTrade(UUID userId, TradeCreateRequest request) {
        log.debug("Creating trade for user {} ticker {}", userId, request.ticker());

        Trade trade = new Trade();
        trade.setUserId(userId);
        trade.setStockId(request.stockId());
        trade.setTicker(request.ticker().toUpperCase());
        trade.setDirection(request.direction() != null
                ? Direction.valueOf(request.direction().toUpperCase()) : Direction.LONG);
        trade.setEntryPrice(request.entryPrice());
        trade.setStopLoss(request.stopLoss());
        trade.setTargetPrice(request.targetPrice());
        trade.setSetupType(request.setupType());
        trade.setNotes(request.notes());
        trade.setAnalysisId(request.analysisId());
        trade.setQuantity(request.quantity());
        trade.setStatus(TradeStatus.OPEN);
        trade.setRrRatio(computeRrRatio(trade.getDirection(), trade.getEntryPrice(),
                trade.getStopLoss(), trade.getTargetPrice()));

        Trade saved = tradeRepository.save(trade);
        return toResponse(saved, null);
    }

    @Transactional(readOnly = true)
    public Page<TradeResponse> listTrades(UUID userId, String status, String ticker, Pageable pageable) {
        Page<Trade> page = tradeRepository.findByUserIdWithFilters(userId, status, ticker, pageable);
        if (page.isEmpty()) return page.map(t -> toResponse(t, null));
        List<UUID> ids = page.map(Trade::getId).toList();
        Map<UUID, List<TradeTrail>> trailMap = tradeTrailRepository
                .findByTradeIdInOrderByCreatedAtDesc(ids)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(TradeTrail::getTradeId));
        return page.map(t -> toResponse(t, trailMap));
    }

    @Transactional(readOnly = true)
    public TradeResponse getTrade(UUID id, UUID userId) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", id.toString()));
        if (!trade.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to trade: " + id);
        }
        return toResponse(trade, null);
    }

    @Transactional(readOnly = true)
    public List<TradeResponse> getTradesByAnalysis(UUID analysisId, UUID userId) {
        return tradeRepository.findByAnalysisId(analysisId)
                .stream()
                .filter(t -> t.getUserId().equals(userId))
                .map(t -> toResponse(t, null))
                .toList();
    }

    public TradeResponse updateTrade(UUID id, UUID userId, TradeUpdateRequest request) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", id.toString()));
        if (!trade.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to trade: " + id);
        }
        if (trade.getStatus() != TradeStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot update a trade that is not OPEN");
        }

        List<TradeRevision> revisions = new ArrayList<>();

        if (request.stopLoss() != null && !request.stopLoss().equals(trade.getStopLoss())) {
            revisions.add(buildRevision(id, "stopLoss",
                    trade.getStopLoss().toPlainString(),
                    request.stopLoss().toPlainString(),
                    request.reason()));
            trade.setStopLoss(request.stopLoss());
        }

        if (request.targetPrice() != null && !request.targetPrice().equals(trade.getTargetPrice())) {
            revisions.add(buildRevision(id, "targetPrice",
                    trade.getTargetPrice().toPlainString(),
                    request.targetPrice().toPlainString(),
                    request.reason()));
            trade.setTargetPrice(request.targetPrice());
        }

        if (request.notes() != null && !request.notes().equals(trade.getNotes())) {
            revisions.add(buildRevision(id, "notes",
                    trade.getNotes(), request.notes(), request.reason()));
            trade.setNotes(request.notes());
        }

        if (request.setupType() != null && !request.setupType().equals(trade.getSetupType())) {
            revisions.add(buildRevision(id, "setupType",
                    trade.getSetupType(), request.setupType(), request.reason()));
            trade.setSetupType(request.setupType());
        }

        if (request.quantity() != null) {
            trade.setQuantity(request.quantity());
        }

        trade.setRrRatio(computeRrRatio(trade.getDirection(), trade.getEntryPrice(),
                trade.getStopLoss(), trade.getTargetPrice()));

        if (!revisions.isEmpty()) {
            tradeRevisionRepository.saveAll(revisions);
        }

        Trade saved = tradeRepository.save(trade);
        return toResponse(saved, null);
    }

    public TradeResponse closeTrade(UUID id, UUID userId, CloseTradeRequest request) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", id.toString()));
        if (!trade.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to trade: " + id);
        }
        if (trade.getStatus() != TradeStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trade is not OPEN, cannot close");
        }

        trade.setStatus(TradeStatus.CLOSED);
        trade.setOutcome(TradeOutcome.valueOf(request.outcome().toUpperCase()));
        trade.setClosedAt(Instant.now());
        trade.setActualExitPrice(request.actualExitPrice());
        if (request.notes() != null) {
            trade.setNotes(request.notes());
        }

        Trade saved = tradeRepository.save(trade);
        log.debug("Closed trade {} with outcome {}", id, request.outcome());
        return toResponse(saved, null);
    }

    public void cancelTrade(UUID id, UUID userId) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", id.toString()));
        if (!trade.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to trade: " + id);
        }
        if (trade.getStatus() != TradeStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trade is not OPEN, cannot cancel");
        }

        trade.setStatus(TradeStatus.CANCELLED);
        tradeRepository.save(trade);
        log.debug("Cancelled trade {}", id);
    }

    public void deleteTrade(UUID id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", id.toString()));
        tradeTrailRepository.deleteByTradeId(id);
        tradeRevisionRepository.deleteAll(tradeRevisionRepository.findByTradeIdOrderByRevisedAtDesc(id));
        tradeRepository.delete(trade);
        log.debug("Deleted trade {}", id);
    }

    @Transactional(readOnly = true)
    public List<RevisionResponse> getRevisions(UUID tradeId, UUID userId) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", tradeId.toString()));
        if (!trade.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to trade: " + tradeId);
        }
        return tradeRevisionRepository.findByTradeIdOrderByRevisedAtDesc(tradeId)
                .stream()
                .map(this::toRevisionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TradeResponse> getOpenTrades() {
        List<Trade> open = tradeRepository.findByStatus(TradeStatus.OPEN);
        return buildResponseList(open);
    }

    @Transactional(readOnly = true)
    public long countTrades(UUID userId, String status) {
        if (status == null || status.isBlank()) {
            return tradeRepository.countByUserIdAndStatus(userId, TradeStatus.OPEN)
                    + tradeRepository.countByUserIdAndStatus(userId, TradeStatus.CLOSED)
                    + tradeRepository.countByUserIdAndStatus(userId, TradeStatus.CANCELLED);
        }
        return tradeRepository.countByUserIdAndStatus(userId, TradeStatus.valueOf(status.toUpperCase()));
    }

    @Transactional(readOnly = true)
    public TradeStatsResponse getStats(UUID userId) {
        long openCount = tradeRepository.countByUserIdAndStatus(userId, TradeStatus.OPEN);
        long closedCount = tradeRepository.countByUserIdAndStatus(userId, TradeStatus.CLOSED);
        long cancelledCount = tradeRepository.countByUserIdAndStatus(userId, TradeStatus.CANCELLED);
        long totalCount = openCount + closedCount + cancelledCount;
        return new TradeStatsResponse(openCount, closedCount, cancelledCount, totalCount);
    }

    // ── P/L analytics ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PLSummaryResponse getPLSummary(UUID userId) {
        List<Trade> allClosed = tradeRepository.findByUserIdAndStatusOrderByClosedAtDesc(userId, TradeStatus.CLOSED);
        long profitCount = allClosed.stream().filter(t -> computePL(t) != null && computePL(t).compareTo(BigDecimal.ZERO) > 0).count();
        long lossCount   = allClosed.stream().filter(t -> computePL(t) != null && computePL(t).compareTo(BigDecimal.ZERO) < 0).count();
        long openCount   = tradeRepository.countByUserIdAndStatus(userId, TradeStatus.OPEN);

        LocalDate periodEnd   = LocalDate.now();
        LocalDate periodStart = periodEnd.minusMonths(1);
        Instant since = periodStart.atStartOfDay(ZoneOffset.UTC).toInstant();

        List<Trade> monthClosed = tradeRepository.findByUserIdAndStatusAndClosedAtAfterOrderByClosedAtDesc(
                userId, TradeStatus.CLOSED, since);

        BigDecimal totalProfit = BigDecimal.ZERO;
        BigDecimal totalLoss   = BigDecimal.ZERO;
        for (Trade t : monthClosed) {
            BigDecimal pl = computePL(t);
            if (pl == null) continue;
            if (pl.compareTo(BigDecimal.ZERO) > 0) totalProfit = totalProfit.add(pl);
            else totalLoss = totalLoss.add(pl.abs());
        }

        return new PLSummaryResponse(
                allClosed.size(), profitCount, lossCount, openCount,
                totalProfit, totalLoss, totalProfit.subtract(totalLoss),
                periodStart, periodEnd
        );
    }

    @Transactional(readOnly = true)
    public List<TradeResponse> getPLDetail(UUID userId, int months, String type, String ticker, String direction) {
        LocalDate since = LocalDate.now().minusMonths(months);
        Instant sinceInstant = since.atStartOfDay(ZoneOffset.UTC).toInstant();

        return tradeRepository.findByUserIdAndStatusAndClosedAtAfterOrderByClosedAtDesc(userId, TradeStatus.CLOSED, sinceInstant)
                .stream()
                .filter(t -> {
                    if (ticker != null && !ticker.isBlank()) {
                        return t.getTicker().equalsIgnoreCase(ticker.trim());
                    }
                    return true;
                })
                .filter(t -> {
                    if (direction != null && !direction.isBlank()) {
                        return t.getDirection() != null &&
                               t.getDirection().name().equalsIgnoreCase(direction.trim());
                    }
                    return true;
                })
                .filter(t -> {
                    if (type == null || type.isBlank() || "ALL".equalsIgnoreCase(type)) return true;
                    BigDecimal pl = computePL(t);
                    if ("PROFIT".equalsIgnoreCase(type)) return pl != null && pl.compareTo(BigDecimal.ZERO) > 0;
                    if ("LOSS".equalsIgnoreCase(type)) return pl != null && pl.compareTo(BigDecimal.ZERO) < 0;
                    return true;
                })
                .map(t -> toResponse(t, null))
                .toList();
    }

    // ── Trail methods ──────────────────────────────────────────────────────────

    public TradeTrailResponse addTrailEntry(UUID tradeId, UUID userId, TradeTrailCreateRequest request) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", tradeId.toString()));
        if (!trade.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to trade: " + tradeId);
        }
        if (trade.getStatus() != TradeStatus.OPEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot add trail to a non-OPEN trade");
        }
        if (request.newStopLoss() == null && request.newTarget() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least one of newStopLoss or newTarget must be provided");
        }

        List<TradeTrail> existing = tradeTrailRepository.findByTradeIdOrderByCreatedAtDesc(tradeId);

        BigDecimal currentSL = existing.stream()
                .map(TradeTrail::getNewStopLoss).filter(Objects::nonNull).findFirst()
                .orElse(trade.getStopLoss());
        BigDecimal currentTarget = existing.stream()
                .map(TradeTrail::getNewTarget).filter(Objects::nonNull).findFirst()
                .orElse(trade.getTargetPrice());

        TradeTrail trail = new TradeTrail();
        trail.setTradeId(tradeId);
        trail.setPreviousStopLoss(request.newStopLoss() != null ? currentSL : null);
        trail.setNewStopLoss(request.newStopLoss());
        trail.setPreviousTarget(request.newTarget() != null ? currentTarget : null);
        trail.setNewTarget(request.newTarget());
        trail.setReason(request.reason());
        trail.setNotes(request.notes());

        TradeTrail saved = tradeTrailRepository.save(trail);
        log.debug("Added trail entry {} for trade {}", saved.getId(), tradeId);
        return toTrailResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TradeTrailResponse> getTrailEntries(UUID tradeId, UUID userId) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade", tradeId.toString()));
        if (!trade.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to trade: " + tradeId);
        }
        return tradeTrailRepository.findByTradeIdOrderByCreatedAtAsc(tradeId)
                .stream()
                .map(this::toTrailResponse)
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal computeRrRatio(Direction direction, BigDecimal entryPrice,
                                       BigDecimal stopLoss, BigDecimal targetPrice) {
        try {
            BigDecimal risk, reward;
            if (Direction.LONG == direction) {
                risk = entryPrice.subtract(stopLoss);
                reward = targetPrice.subtract(entryPrice);
            } else {
                risk = stopLoss.subtract(entryPrice);
                reward = entryPrice.subtract(targetPrice);
            }
            if (risk.compareTo(BigDecimal.ZERO) > 0) {
                return reward.divide(risk, 4, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            log.warn("Could not compute R/R ratio: {}", e.getMessage());
        }
        return null;
    }

    private BigDecimal computePL(Trade trade) {
        if (trade.getActualExitPrice() == null || trade.getEntryPrice() == null) return null;
        BigDecimal qty = trade.getQuantity() != null ? trade.getQuantity() : BigDecimal.ONE;
        BigDecimal diff;
        if (Direction.LONG == trade.getDirection()) {
            diff = trade.getActualExitPrice().subtract(trade.getEntryPrice());
        } else {
            diff = trade.getEntryPrice().subtract(trade.getActualExitPrice());
        }
        return diff.multiply(qty).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal computePLPercent(Trade trade) {
        BigDecimal pl = computePL(trade);
        if (pl == null || trade.getEntryPrice() == null || trade.getEntryPrice().compareTo(BigDecimal.ZERO) == 0) return null;
        BigDecimal qty = trade.getQuantity() != null ? trade.getQuantity() : BigDecimal.ONE;
        BigDecimal investment = trade.getEntryPrice().multiply(qty);
        return pl.divide(investment, 6, RoundingMode.HALF_UP)
                 .multiply(BigDecimal.valueOf(100))
                 .setScale(2, RoundingMode.HALF_UP);
    }

    private Long computeHoldingDays(Trade trade) {
        if (trade.getCreatedAt() == null || trade.getClosedAt() == null) return null;
        return Duration.between(trade.getCreatedAt(), trade.getClosedAt()).toDays();
    }

    private TradeRevision buildRevision(UUID tradeId, String field,
                                         String oldValue, String newValue, String reason) {
        TradeRevision rev = new TradeRevision();
        rev.setTradeId(tradeId);
        rev.setFieldChanged(field);
        rev.setOldValue(oldValue);
        rev.setNewValue(newValue);
        rev.setReason(reason);
        return rev;
    }

    private TradeResponse toResponse(Trade trade, Map<UUID, List<TradeTrail>> trailMap) {
        List<TradeTrail> trails = trailMap != null
                ? trailMap.getOrDefault(trade.getId(), List.of())
                : tradeTrailRepository.findByTradeIdOrderByCreatedAtDesc(trade.getId());

        BigDecimal activeSL = trails.stream()
                .map(TradeTrail::getNewStopLoss).filter(Objects::nonNull).findFirst()
                .orElse(trade.getStopLoss());
        BigDecimal activeTarget = trails.stream()
                .map(TradeTrail::getNewTarget).filter(Objects::nonNull).findFirst()
                .orElse(trade.getTargetPrice());

        return new TradeResponse(
                trade.getId(),
                trade.getUserId(),
                trade.getStockId(),
                trade.getTicker(),
                trade.getDirection() != null ? trade.getDirection().name() : null,
                trade.getEntryPrice(),
                trade.getStopLoss(),
                trade.getTargetPrice(),
                trade.getRrRatio(),
                trade.getStatus() != null ? trade.getStatus().name() : null,
                trade.getOutcome() != null ? trade.getOutcome().name() : null,
                trade.getNotes(),
                trade.getSetupType(),
                trade.getCreatedAt(),
                trade.getClosedAt(),
                trade.getActualExitPrice(),
                trade.getAnalysisId(),
                activeSL,
                activeTarget,
                trade.getQuantity(),
                computePL(trade),
                computePLPercent(trade),
                computeHoldingDays(trade)
        );
    }

    private List<TradeResponse> buildResponseList(List<Trade> trades) {
        if (trades.isEmpty()) return List.of();
        List<UUID> ids = trades.stream().map(Trade::getId).toList();
        Map<UUID, List<TradeTrail>> trailMap = tradeTrailRepository
                .findByTradeIdInOrderByCreatedAtDesc(ids)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(TradeTrail::getTradeId));
        return trades.stream().map(t -> toResponse(t, trailMap)).toList();
    }

    private RevisionResponse toRevisionResponse(TradeRevision rev) {
        return new RevisionResponse(
                rev.getId(),
                rev.getFieldChanged(),
                rev.getOldValue(),
                rev.getNewValue(),
                rev.getRevisedAt(),
                rev.getReason()
        );
    }

    private TradeTrailResponse toTrailResponse(TradeTrail trail) {
        return new TradeTrailResponse(
                trail.getId(),
                trail.getTradeId(),
                trail.getPreviousStopLoss(),
                trail.getNewStopLoss(),
                trail.getPreviousTarget(),
                trail.getNewTarget(),
                trail.getReason(),
                trail.getNotes(),
                trail.getCreatedAt()
        );
    }
}
