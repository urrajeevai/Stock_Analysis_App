package com.stockapp.rsi.service;

import com.stockapp.common.exception.ApiException;
import com.stockapp.rsi.dto.*;
import com.stockapp.rsi.entity.RsiScore;
import com.stockapp.rsi.entity.RsiUpload;
import com.stockapp.rsi.repository.RsiScoreRepository;
import com.stockapp.rsi.repository.RsiUploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RsiService {

    // CSV column name constants (lower-cased for header-driven detection)
    private static final String COL_SYMBOL      = "symbol";
    private static final String COL_STOCK_NAME  = "stock name";
    private static final String COL_SECTOR_NAME = "sector name";
    private static final String COL_RSI         = "rsi";

    private final RsiScoreRepository rsiScoreRepository;
    private final RsiUploadRepository rsiUploadRepository;
    private final RsiRowSaver rsiRowSaver;

    // ── CSV Upload ──────────────────────────────────────────────────────────

    /**
     * Parses and upserts RSI scores from a CSV file.
     * Required columns: Stock Name, Symbol, RSI.
     * Optional: Sector Name.
     * All other columns (Exch, Industry Name, Prev. RSI, Close, Chg %, etc.) are ignored.
     * Upserts by (symbol + scoreDate). Each row runs in its own REQUIRES_NEW transaction.
     */
    @Transactional
    @CacheEvict(value = com.stockapp.rsi.config.CacheConfig.RSI_TRENDING, allEntries = true)
    public RsiUploadResult uploadCsv(MultipartFile file, LocalDate scoreDate, UUID userId) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CSV file is empty");
        }
        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".csv")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only .csv files are accepted");
        }

        LocalDate effectiveDate = scoreDate != null ? scoreDate : LocalDate.now();

        RsiUpload upload = new RsiUpload();
        upload.setFileName(filename);
        upload.setScoreDate(effectiveDate);
        upload.setUploadedBy(userId);
        upload = rsiUploadRepository.save(upload);
        Long uploadId = upload.getId();

        int inserted = 0, updated = 0, failed = 0;
        List<String> errors = new ArrayList<>();
        Set<String> seenSymbols = new HashSet<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "CSV file has no content");
            }

            // Strip UTF-8 BOM added by Excel/NSE tools
            if (!headerLine.isEmpty() && (int) headerLine.charAt(0) == 0xFEFF) {
                headerLine = headerLine.substring(1);
            }

            String[] rawHeaders = parseCsvRow(headerLine);
            Map<String, Integer> idx = new HashMap<>();
            for (int i = 0; i < rawHeaders.length; i++) {
                idx.put(normalizeHeader(rawHeaders[i]), i);
            }

            log.debug("RSI CSV headers (normalised): [{}]",
                    idx.keySet().stream().sorted().collect(Collectors.joining(", ")));

            Integer symbolIdx = idx.get(COL_SYMBOL);
            Integer nameIdx   = idx.get(COL_STOCK_NAME);
            Integer sectorIdx = idx.get(COL_SECTOR_NAME);
            Integer rsiIdx    = idx.get(COL_RSI);

            if (symbolIdx == null || nameIdx == null || rsiIdx == null) {
                List<String> missing = new ArrayList<>();
                if (symbolIdx == null) missing.add("Symbol");
                if (nameIdx == null)   missing.add("Stock Name");
                if (rsiIdx == null)    missing.add("RSI");
                String found = Arrays.stream(rawHeaders)
                        .map(this::normalizeHeader).collect(Collectors.joining(", "));
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "CSV is missing required header(s): " + missing +
                        ". Headers found (normalised): [" + found + "]");
            }

            String line;
            int lineNum = 1;

            while ((line = reader.readLine()) != null) {
                lineNum++;
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                String[] cols;
                try {
                    cols = parseCsvRow(trimmed);
                } catch (Exception e) {
                    errors.add("Row " + lineNum + ": parse error — " + e.getMessage());
                    failed++;
                    continue;
                }

                String symbol    = col(cols, symbolIdx, "").trim().toUpperCase();
                String stockName = col(cols, nameIdx, "").trim();
                String sector    = sectorIdx != null ? col(cols, sectorIdx, "").trim() : "";
                String rsiStr    = col(cols, rsiIdx, "").trim();

                if (symbol.isEmpty()) {
                    errors.add("Row " + lineNum + ": Symbol is blank — skipped");
                    failed++; continue;
                }
                if (stockName.isEmpty()) {
                    errors.add("Row " + lineNum + " (" + symbol + "): Stock Name is blank — skipped");
                    failed++; continue;
                }
                if (rsiStr.isEmpty()) {
                    errors.add("Row " + lineNum + " (" + symbol + "): RSI is blank — skipped");
                    failed++; continue;
                }

                BigDecimal rsiVal;
                try {
                    rsiVal = new BigDecimal(rsiStr).setScale(4, RoundingMode.HALF_UP);
                } catch (NumberFormatException e) {
                    errors.add("Row " + lineNum + " (" + symbol + "): RSI '" + rsiStr + "' is not numeric — skipped");
                    failed++; continue;
                }

                if (seenSymbols.contains(symbol)) {
                    errors.add("Row " + lineNum + " (" + symbol + "): Duplicate symbol in this upload — skipped");
                    failed++; continue;
                }
                seenSymbols.add(symbol);

                try {
                    String result = rsiRowSaver.upsertRow(symbol, stockName, sector,
                                                          rsiVal, effectiveDate, uploadId, userId);
                    if ("INSERTED".equals(result)) inserted++;
                    else                           updated++;
                } catch (Exception e) {
                    log.warn("Row {} ({}) save failed: {}", lineNum, symbol, e.getMessage());
                    errors.add("Row " + lineNum + " (" + symbol + "): " + e.getMessage());
                    failed++;
                }
            }

        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot read CSV: " + e.getMessage());
        }

        upload.setTotalRows(inserted + updated + failed);
        upload.setInserted(inserted);
        upload.setUpdated(updated);
        upload.setFailed(failed);
        rsiUploadRepository.save(upload);

        log.info("RSI CSV upload done — inserted={} updated={} failed={} date={} id={}",
                inserted, updated, failed, effectiveDate, uploadId);

        return new RsiUploadResult(
                uploadId, filename, effectiveDate,
                inserted, updated, failed, inserted + updated + failed, errors);
    }

    // ── Scores Browser ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<RsiScoreResponse> listScores(
            LocalDate dateFrom, LocalDate dateTo, Integer lastNDays,
            String sector, String symbol, Pageable pageable) {
        LocalDate[] range = resolveDateRange(dateFrom, dateTo, lastNDays);
        return rsiScoreRepository.findWithFilters(
                range[0], range[1],
                (sector != null && !sector.isBlank()) ? sector : null,
                (symbol != null && !symbol.isBlank()) ? symbol : null,
                pageable).map(this::toScoreResponse);
    }

    @Transactional(readOnly = true)
    public List<LocalDate> getAvailableDates() {
        return rsiScoreRepository.findDistinctScoreDates();
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableSectors() {
        return rsiScoreRepository.findDistinctSectors();
    }

    @Transactional(readOnly = true)
    public List<RsiUploadSummary> listUploads() {
        return rsiUploadRepository.findAllByOrderByUploadedAtDesc()
                .stream().map(this::toUploadSummary).toList();
    }

    // ── Trending Report ─────────────────────────────────────────────────────

    /**
     * Returns stocks whose RSI is >= minRsi on every selected date and strictly
     * increasing day-over-day. Uses a MySQL 8 LAG window-function query.
     * Results are cached and evicted on every CSV upload.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = com.stockapp.rsi.config.CacheConfig.RSI_TRENDING,
               key = "#lastNDays + '-' + #minRsi + '-' + #dateFrom + '-' + #dateTo")
    public List<TrendingRsiStockResponse> getTrendingStocks(
            int lastNDays, BigDecimal minRsi, LocalDate dateFrom, LocalDate dateTo) {

        List<LocalDate> datesAsc;

        if (dateFrom != null && dateTo != null) {
            datesAsc = rsiScoreRepository.findDatesBetween(dateFrom, dateTo);
        } else {
            if (lastNDays < 2) lastNDays = 2;
            List<LocalDate> recentDates = rsiScoreRepository.findRecentDates(lastNDays);
            datesAsc = new ArrayList<>(recentDates);
            Collections.sort(datesAsc);
        }

        if (datesAsc.size() < 2) return Collections.emptyList();

        List<RsiScore> rows = rsiScoreRepository.findTrendingByDatesAndMinRsi(
                datesAsc, minRsi, datesAsc.size());

        Map<String, List<RsiScore>> bySymbol = rows.stream()
                .collect(Collectors.groupingBy(RsiScore::getSymbol));

        return bySymbol.values().stream()
                .map(scores -> buildTrendingResponse(scores, datesAsc))
                .sorted(Comparator.comparing(TrendingRsiStockResponse::latestRsi).reversed())
                .toList();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private String normalizeHeader(String h) {
        if (h == null) return "";
        StringBuilder sb = new StringBuilder(h.length());
        for (int i = 0; i < h.length(); i++) {
            int c = h.charAt(i);
            if (c == 0xFEFF || c == 0x00A0
                    || (c >= 0x200B && c <= 0x200D)
                    || c == 0xFFFD
                    || c < 0x20 || c == 0x7F) {
                continue;
            }
            sb.append((char) c);
        }
        return sb.toString().trim().toLowerCase();
    }

    private LocalDate[] resolveDateRange(LocalDate from, LocalDate to, Integer lastNDays) {
        if (lastNDays != null && lastNDays > 0) {
            LocalDate end = LocalDate.now();
            return new LocalDate[]{end.minusDays(lastNDays - 1L), end};
        }
        return new LocalDate[]{from, to};
    }

    private TrendingRsiStockResponse buildTrendingResponse(List<RsiScore> raw, List<LocalDate> datesAsc) {
        Set<LocalDate> selectedDates = new HashSet<>(datesAsc);
        List<RsiScore> s = raw.stream()
                .filter(x -> selectedDates.contains(x.getScoreDate()))
                .sorted(Comparator.comparing(RsiScore::getScoreDate))
                .toList();
        RsiScore first  = s.get(0);
        RsiScore latest = s.get(s.size() - 1);
        List<DailyRsiScore> daily = s.stream()
                .map(x -> new DailyRsiScore(x.getScoreDate(), x.getRsiScore())).toList();
        BigDecimal change = latest.getRsiScore().subtract(first.getRsiScore())
                .setScale(4, RoundingMode.HALF_UP);
        return new TrendingRsiStockResponse(
                latest.getSymbol(), latest.getStockName(), latest.getSectorName(),
                latest.getRsiScore(), latest.getScoreDate(), daily, change);
    }

    private RsiScoreResponse toScoreResponse(RsiScore s) {
        return new RsiScoreResponse(s.getId(), s.getSymbol(), s.getStockName(),
                s.getSectorName(), s.getRsiScore(), s.getScoreDate(), s.getUploadId(),
                s.getCreatedAt(), s.getUpdatedAt());
    }

    private RsiUploadSummary toUploadSummary(RsiUpload u) {
        return new RsiUploadSummary(u.getId(), u.getFileName(), u.getScoreDate(),
                u.getUploadedAt(), u.getInserted(), u.getUpdated(), u.getFailed(), u.getTotalRows());
    }

    private static String col(String[] cols, int idx, String def) {
        return (idx >= 0 && idx < cols.length) ? cols[idx] : def;
    }

    public static String[] parseCsvRow(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder cur = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    cur.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                fields.add(cur.toString());
                cur = new StringBuilder();
            } else {
                cur.append(c);
            }
        }
        fields.add(cur.toString());
        return fields.toArray(new String[0]);
    }
}
