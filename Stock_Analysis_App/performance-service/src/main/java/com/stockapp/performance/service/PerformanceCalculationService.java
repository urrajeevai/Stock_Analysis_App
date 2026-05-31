package com.stockapp.performance.service;

import com.stockapp.performance.client.TradeServiceClient;
import com.stockapp.performance.dto.*;
import com.stockapp.performance.entity.PerformanceSnapshot;
import com.stockapp.performance.repository.PerformanceSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceCalculationService {

    private static final Logger log = LoggerFactory.getLogger(PerformanceCalculationService.class);

    private static final String WEEKLY   = "WEEKLY";
    private static final String MONTHLY  = "MONTHLY";
    private static final String ALL_TIME = "ALL_TIME";

    private final TradeServiceClient tradeServiceClient;
    private final PerformanceSnapshotRepository snapshotRepository;

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------

    /**
     * Computes an overall performance summary for all closed trades of a user.
     */
    public PerformanceSummaryResponse computeSummary(UUID userId) {
        List<Map<String, Object>> closedTrades = tradeServiceClient.getClosedTrades(userId.toString());

        int total     = closedTrades.size();
        int wins      = 0;
        int losses    = 0;
        int breakevens = 0;
        BigDecimal totalRR    = BigDecimal.ZERO;
        BigDecimal totalWinRR = BigDecimal.ZERO;
        BigDecimal totalLossRR = BigDecimal.ZERO;
        int rrCount    = 0;
        int winRRCount = 0;
        int lossRRCount = 0;

        // Setup type frequency map for best setup (by win count)
        Map<String, int[]> setupStats = new LinkedHashMap<>(); // [winCount, totalCount]

        for (Map<String, Object> trade : closedTrades) {
            String outcome = stringVal(trade, "outcome");
            BigDecimal rr  = bigDecimalVal(trade, "rrRatio");
            String setup   = stringVal(trade, "setupType");

            if ("WIN".equalsIgnoreCase(outcome)) {
                wins++;
                if (rr != null) { totalWinRR = totalWinRR.add(rr); winRRCount++; }
            } else if ("LOSS".equalsIgnoreCase(outcome)) {
                losses++;
                if (rr != null) { totalLossRR = totalLossRR.add(rr); lossRRCount++; }
            } else {
                breakevens++;
            }

            if (rr != null) {
                totalRR = totalRR.add(rr);
                rrCount++;
            }

            if (setup != null && !setup.isBlank()) {
                setupStats.computeIfAbsent(setup, k -> new int[]{0, 0});
                setupStats.get(setup)[1]++;
                if ("WIN".equalsIgnoreCase(outcome)) {
                    setupStats.get(setup)[0]++;
                }
            }
        }

        BigDecimal strikeRate = total > 0
                ? BigDecimal.valueOf(wins).divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                             .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal avgRR    = rrCount > 0
                ? totalRR.divide(BigDecimal.valueOf(rrCount), 4, RoundingMode.HALF_UP)
                : null;

        BigDecimal avgWinRR = winRRCount > 0
                ? totalWinRR.divide(BigDecimal.valueOf(winRRCount), 4, RoundingMode.HALF_UP)
                : null;

        BigDecimal avgLossRR = lossRRCount > 0
                ? totalLossRR.divide(BigDecimal.valueOf(lossRRCount), 4, RoundingMode.HALF_UP)
                : null;

        String bestSetup = findBestSetup(setupStats);

        int openTrades = tradeServiceClient.countOpenTrades(userId.toString());

        return new PerformanceSummaryResponse(
                total, wins, losses, breakevens,
                strikeRate, avgRR, avgWinRR, avgLossRR,
                bestSetup, openTrades
        );
    }

    // -----------------------------------------------------------------------
    // Weekly breakdown
    // -----------------------------------------------------------------------

    /**
     * Groups all closed trades by ISO week (year + week number) and returns
     * performance metrics per week, sorted newest first.
     */
    public List<PeriodPerformanceResponse> computeWeekly(UUID userId) {
        List<Map<String, Object>> closedTrades = tradeServiceClient.getClosedTrades(userId.toString());

        // Group trades by ISO year-week key
        Map<String, List<Map<String, Object>>> byWeek = new LinkedHashMap<>();
        for (Map<String, Object> trade : closedTrades) {
            LocalDate closedDate = parseClosedAt(trade);
            if (closedDate == null) continue;

            int isoYear  = closedDate.get(IsoFields.WEEK_BASED_YEAR);
            int isoWeek  = closedDate.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            String key   = isoYear + "-W" + String.format("%02d", isoWeek);
            byWeek.computeIfAbsent(key, k -> new ArrayList<>()).add(trade);
        }

        // Convert to sorted list (newest first by key descending)
        return byWeek.entrySet().stream()
                .sorted(Map.Entry.<String, List<Map<String, Object>>>comparingByKey().reversed())
                .map(entry -> {
                    // Compute period boundaries from the first trade's closedAt
                    LocalDate sample = parseClosedAt(entry.getValue().get(0));
                    LocalDate weekStart = sample != null
                            ? sample.with(WeekFields.ISO.dayOfWeek(), 1)
                            : LocalDate.now();
                    LocalDate weekEnd = weekStart.plusDays(6);
                    return buildPeriodResponse(entry.getValue(), WEEKLY, weekStart, weekEnd);
                })
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // Monthly breakdown
    // -----------------------------------------------------------------------

    /**
     * Groups all closed trades by calendar month and returns performance metrics per month.
     */
    public List<PeriodPerformanceResponse> computeMonthly(UUID userId) {
        List<Map<String, Object>> closedTrades = tradeServiceClient.getClosedTrades(userId.toString());

        Map<String, List<Map<String, Object>>> byMonth = new LinkedHashMap<>();
        for (Map<String, Object> trade : closedTrades) {
            LocalDate closedDate = parseClosedAt(trade);
            if (closedDate == null) continue;

            String key = closedDate.getYear() + "-" + String.format("%02d", closedDate.getMonthValue());
            byMonth.computeIfAbsent(key, k -> new ArrayList<>()).add(trade);
        }

        return byMonth.entrySet().stream()
                .sorted(Map.Entry.<String, List<Map<String, Object>>>comparingByKey().reversed())
                .map(entry -> {
                    LocalDate sample = parseClosedAt(entry.getValue().get(0));
                    LocalDate monthStart = sample != null
                            ? sample.withDayOfMonth(1)
                            : LocalDate.now().withDayOfMonth(1);
                    LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
                    return buildPeriodResponse(entry.getValue(), MONTHLY, monthStart, monthEnd);
                })
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // Custom period
    // -----------------------------------------------------------------------

    /**
     * Returns performance for closed trades whose closedAt falls between [from, to] inclusive.
     */
    public PeriodPerformanceResponse computeForPeriod(UUID userId, LocalDate from, LocalDate to) {
        List<Map<String, Object>> closedTrades = tradeServiceClient.getClosedTrades(userId.toString());

        List<Map<String, Object>> filtered = closedTrades.stream()
                .filter(t -> {
                    LocalDate d = parseClosedAt(t);
                    return d != null && !d.isBefore(from) && !d.isAfter(to);
                })
                .collect(Collectors.toList());

        return buildPeriodResponse(filtered, "CUSTOM", from, to);
    }

    // -----------------------------------------------------------------------
    // Setup performance
    // -----------------------------------------------------------------------

    /**
     * Groups closed trades by setup type and returns win rate and avg RR per setup,
     * sorted by strike rate descending.
     */
    public List<SetupPerformanceResponse> getBestSetups(UUID userId) {
        List<Map<String, Object>> closedTrades = tradeServiceClient.getClosedTrades(userId.toString());

        Map<String, List<Map<String, Object>>> bySetup = new LinkedHashMap<>();
        for (Map<String, Object> trade : closedTrades) {
            String setup = stringVal(trade, "setupType");
            if (setup == null || setup.isBlank()) setup = "UNTAGGED";
            bySetup.computeIfAbsent(setup, k -> new ArrayList<>()).add(trade);
        }

        return bySetup.entrySet().stream()
                .map(entry -> {
                    List<Map<String, Object>> trades = entry.getValue();
                    int total  = trades.size();
                    int wins   = (int) trades.stream()
                            .filter(t -> "WIN".equalsIgnoreCase(stringVal(t, "outcome")))
                            .count();
                    int losses = (int) trades.stream()
                            .filter(t -> "LOSS".equalsIgnoreCase(stringVal(t, "outcome")))
                            .count();

                    BigDecimal strikeRate = total > 0
                            ? BigDecimal.valueOf(wins)
                                        .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100))
                            : BigDecimal.ZERO;

                    BigDecimal avgRR = computeAvgRR(trades);

                    return new SetupPerformanceResponse(entry.getKey(), total, wins, losses, strikeRate, avgRR);
                })
                .sorted(Comparator.comparing(SetupPerformanceResponse::strikeRate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // RR Distribution
    // -----------------------------------------------------------------------

    /**
     * Buckets closed trades by their rrRatio:
     *   "<1", "1-2", "2-3", "3+"
     */
    public List<RRDistributionResponse> getRRDistribution(UUID userId) {
        List<Map<String, Object>> closedTrades = tradeServiceClient.getClosedTrades(userId.toString());

        int bucket0 = 0;  // <1
        int bucket1 = 0;  // 1-2
        int bucket2 = 0;  // 2-3
        int bucket3 = 0;  // 3+

        for (Map<String, Object> trade : closedTrades) {
            BigDecimal rr = bigDecimalVal(trade, "rrRatio");
            if (rr == null) continue;

            double val = rr.doubleValue();
            if (val < 1.0)      bucket0++;
            else if (val < 2.0) bucket1++;
            else if (val < 3.0) bucket2++;
            else                bucket3++;
        }

        return List.of(
                new RRDistributionResponse("<1",  bucket0),
                new RRDistributionResponse("1-2", bucket1),
                new RRDistributionResponse("2-3", bucket2),
                new RRDistributionResponse("3+",  bucket3)
        );
    }

    // -----------------------------------------------------------------------
    // Force recompute
    // -----------------------------------------------------------------------

    /**
     * Deletes all stored snapshots for the user and re-runs computations to persist new ones.
     */
    @Transactional
    public void forceRecompute(UUID userId) {
        log.info("Force-recomputing performance snapshots for user {}", userId);

        // Delete existing snapshots
        snapshotRepository.deleteByUserIdAndPeriodType(userId, WEEKLY);
        snapshotRepository.deleteByUserIdAndPeriodType(userId, MONTHLY);
        snapshotRepository.deleteByUserIdAndPeriodType(userId, ALL_TIME);

        // Compute and persist WEEKLY snapshots
        List<PeriodPerformanceResponse> weekly = computeWeekly(userId);
        for (PeriodPerformanceResponse w : weekly) {
            persistSnapshot(userId, WEEKLY, w.periodStart(), w.periodEnd(),
                    w.winCount(), w.lossCount(), w.totalTrades(), w.strikeRate(), w.avgRR());
        }

        // Compute and persist MONTHLY snapshots
        List<PeriodPerformanceResponse> monthly = computeMonthly(userId);
        for (PeriodPerformanceResponse m : monthly) {
            persistSnapshot(userId, MONTHLY, m.periodStart(), m.periodEnd(),
                    m.winCount(), m.lossCount(), m.totalTrades(), m.strikeRate(), m.avgRR());
        }

        // Compute and persist ALL_TIME snapshot
        PerformanceSummaryResponse summary = computeSummary(userId);
        LocalDate allTimeStart = LocalDate.of(2000, 1, 1);
        LocalDate allTimeEnd   = LocalDate.now();
        BigDecimal sr = summary.strikeRate();
        BigDecimal ar = summary.avgRR();

        PerformanceSnapshot allTime = new PerformanceSnapshot();
        allTime.setUserId(userId);
        allTime.setPeriodType(ALL_TIME);
        allTime.setPeriodStart(allTimeStart);
        allTime.setPeriodEnd(allTimeEnd);
        allTime.setWinCount(summary.winCount());
        allTime.setLossCount(summary.lossCount());
        allTime.setTotalTrades(summary.totalTrades());
        allTime.setStrikeRate(sr);
        allTime.setAvgRr(ar);
        allTime.setAvgWinRr(summary.avgWinRR());
        allTime.setAvgLossRr(summary.avgLossRR());
        allTime.setBestSetupType(summary.bestSetupType());
        snapshotRepository.save(allTime);

        log.info("Recomputed {} weekly and {} monthly snapshots for user {}",
                weekly.size(), monthly.size(), userId);
    }

    // -----------------------------------------------------------------------
    // Helper methods
    // -----------------------------------------------------------------------

    private PeriodPerformanceResponse buildPeriodResponse(
            List<Map<String, Object>> trades,
            String periodType,
            LocalDate start,
            LocalDate end) {

        int total  = trades.size();
        int wins   = (int) trades.stream()
                .filter(t -> "WIN".equalsIgnoreCase(stringVal(t, "outcome")))
                .count();
        int losses = (int) trades.stream()
                .filter(t -> "LOSS".equalsIgnoreCase(stringVal(t, "outcome")))
                .count();

        BigDecimal strikeRate = total > 0
                ? BigDecimal.valueOf(wins)
                            .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal avgRR = computeAvgRR(trades);

        BigDecimal profitSum = BigDecimal.ZERO;
        BigDecimal lossSum   = BigDecimal.ZERO;
        for (Map<String, Object> t : trades) {
            BigDecimal pl = bigDecimalVal(t, "plAmount");
            if (pl == null) continue;
            if (pl.compareTo(BigDecimal.ZERO) > 0) profitSum = profitSum.add(pl);
            else lossSum = lossSum.add(pl.abs());
        }
        BigDecimal totalPL = profitSum.subtract(lossSum);

        return new PeriodPerformanceResponse(start, end, periodType, wins, losses, total,
                strikeRate, avgRR, totalPL, profitSum, lossSum);
    }

    private BigDecimal computeAvgRR(List<Map<String, Object>> trades) {
        BigDecimal total = BigDecimal.ZERO;
        int count = 0;
        for (Map<String, Object> t : trades) {
            BigDecimal rr = bigDecimalVal(t, "rrRatio");
            if (rr != null) {
                total = total.add(rr);
                count++;
            }
        }
        return count > 0
                ? total.divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP)
                : null;
    }

    private String findBestSetup(Map<String, int[]> setupStats) {
        return setupStats.entrySet().stream()
                .filter(e -> e.getValue()[1] > 0)
                .max(Comparator.comparingDouble(e -> (double) e.getValue()[0] / e.getValue()[1]))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private LocalDate parseClosedAt(Map<String, Object> trade) {
        Object raw = trade.get("closedAt");
        if (raw == null) return null;
        try {
            // trade-service returns closedAt as an ISO-8601 instant string
            Instant instant = Instant.parse(raw.toString());
            return instant.atZone(ZoneOffset.UTC).toLocalDate();
        } catch (Exception e) {
            try {
                return LocalDate.parse(raw.toString(), DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (Exception ex) {
                log.warn("Could not parse closedAt value: {}", raw);
                return null;
            }
        }
    }

    private void persistSnapshot(UUID userId, String periodType,
                                  LocalDate start, LocalDate end,
                                  int wins, int losses, int total,
                                  BigDecimal strikeRate, BigDecimal avgRR) {
        PerformanceSnapshot snap = new PerformanceSnapshot();
        snap.setUserId(userId);
        snap.setPeriodType(periodType);
        snap.setPeriodStart(start);
        snap.setPeriodEnd(end);
        snap.setWinCount(wins);
        snap.setLossCount(losses);
        snap.setTotalTrades(total);
        snap.setStrikeRate(strikeRate);
        snap.setAvgRr(avgRR);
        snapshotRepository.save(snap);
    }

    private String stringVal(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    private BigDecimal bigDecimalVal(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v == null) return null;
        try {
            return new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
