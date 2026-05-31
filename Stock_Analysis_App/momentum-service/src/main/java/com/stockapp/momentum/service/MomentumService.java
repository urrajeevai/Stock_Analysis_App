package com.stockapp.momentum.service;

import com.stockapp.common.exception.ApiException;
import com.stockapp.momentum.dto.*;
import com.stockapp.momentum.entity.MomentumScore;
import com.stockapp.momentum.entity.MomentumUpload;
import com.stockapp.momentum.repository.MomentumScoreRepository;
import com.stockapp.momentum.repository.MomentumUploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class MomentumService {

    private static final String COL_SYMBOL      = "symbol";
    private static final String COL_STOCK_NAME  = "stock name";
    private static final String COL_SECTOR_NAME = "sector name";
    private static final String COL_SCORE       = "score";

    private final MomentumScoreRepository scoreRepository;
    private final MomentumUploadRepository uploadRepository;
    private final MomentumRowSaver rowSaver;

    // ---- CSV Upload --------------------------------------------------------

    /**
     * Uploads and upserts momentum scores from a CSV file.
     * Column detection is header-driven and case-insensitive.
     * Required: "Symbol", "Stock Name", "Score".  Optional: "Sector Name".
     * All other columns are ignored.
     * Handles UTF-8 BOM (U+FEFF) added by Excel / NSE tools transparently.
     * Each row is saved via MomentumRowSaver (REQUIRES_NEW transaction) so
     * a single bad row cannot corrupt the entire upload.
     */
    @Transactional
    public MomentumUploadResult uploadCsv(MultipartFile file, LocalDate scoreDate, UUID userId) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CSV file is empty");
        }
        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".csv")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only .csv files are accepted");
        }

        LocalDate effectiveDate = scoreDate != null ? scoreDate : LocalDate.now();

        MomentumUpload upload = new MomentumUpload();
        upload.setFileName(filename);
        upload.setScoreDate(effectiveDate);
        upload.setUploadedBy(userId);
        upload = uploadRepository.save(upload);
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

            // Strip UTF-8 BOM (U+FEFF) if present.
            // Excel and NSE/BSE export tools prepend it; Java trim() does NOT remove it
            // because trim() only strips chars <= U+0020.
            if (!headerLine.isEmpty() && (int) headerLine.charAt(0) == 0xFEFF) {
                headerLine = headerLine.substring(1);
                log.debug("Stripped UTF-8 BOM from CSV header");
            }

            String[] rawHeaders = parseCsvRow(headerLine);
            Map<String, Integer> idx = new HashMap<>();
            for (int i = 0; i < rawHeaders.length; i++) {
                idx.put(normalizeHeader(rawHeaders[i]), i);
            }

            log.debug("CSV headers (normalised): [{}]",
                    idx.keySet().stream().sorted().collect(Collectors.joining(", ")));

            Integer symbolIdx = idx.get(COL_SYMBOL);
            Integer nameIdx   = idx.get(COL_STOCK_NAME);
            Integer sectorIdx = idx.get(COL_SECTOR_NAME);
            Integer scoreIdx  = idx.get(COL_SCORE);

            if (symbolIdx == null || nameIdx == null || scoreIdx == null) {
                List<String> missing = new ArrayList<>();
                if (symbolIdx == null) missing.add("Symbol");
                if (nameIdx == null)   missing.add("Stock Name");
                if (scoreIdx == null)  missing.add("Score");
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
                    errors.add("Row " + lineNum + ": parse error - " + e.getMessage());
                    failed++;
                    continue;
                }

                String symbol    = col(cols, symbolIdx, "").trim().toUpperCase();
                String stockName = col(cols, nameIdx,   "").trim();
                String sector    = sectorIdx != null ? col(cols, sectorIdx, "").trim() : "";
                String scoreStr  = col(cols, scoreIdx,  "").trim();

                if (symbol.isEmpty()) {
                    errors.add("Row " + lineNum + ": Symbol is blank - skipped");
                    failed++; continue;
                }
                if (stockName.isEmpty()) {
                    errors.add("Row " + lineNum + " (" + symbol + "): Stock Name is blank - skipped");
                    failed++; continue;
                }
                if (scoreStr.isEmpty()) {
                    errors.add("Row " + lineNum + " (" + symbol + "): Score is blank - skipped");
                    failed++; continue;
                }

                BigDecimal scoreVal;
                try {
                    scoreVal = new BigDecimal(scoreStr).setScale(4, RoundingMode.HALF_UP);
                } catch (NumberFormatException e) {
                    errors.add("Row " + lineNum + " (" + symbol + "): Score '" + scoreStr + "' is not numeric - skipped");
                    failed++; continue;
                }

                if (seenSymbols.contains(symbol)) {
                    errors.add("Row " + lineNum + " (" + symbol + "): Duplicate symbol in this upload - skipped");
                    failed++; continue;
                }
                seenSymbols.add(symbol);

                // Each row saved in its own REQUIRES_NEW transaction via MomentumRowSaver.
                // A failure here never rolls back other rows or the upload record.
                try {
                    String result = rowSaver.upsertRow(symbol, stockName, sector,
                                                       scoreVal, effectiveDate, uploadId, userId);
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
        uploadRepository.save(upload);

        log.info("Momentum CSV upload done - inserted={} updated={} failed={} date={} id={}",
                inserted, updated, failed, effectiveDate, uploadId);

        return new MomentumUploadResult(
                uploadId, filename, effectiveDate,
                inserted, updated, failed, inserted + updated + failed, errors);
    }

    // ---- Scores Browser ----------------------------------------------------

    @Transactional(readOnly = true)
    public Page<MomentumScoreResponse> listScores(
            LocalDate dateFrom, LocalDate dateTo, Integer lastNDays,
            String sector, String symbol, Pageable pageable) {
        LocalDate[] range = resolveDateRange(dateFrom, dateTo, lastNDays);
        return scoreRepository.findWithFilters(
                range[0], range[1],
                (sector != null && !sector.isBlank()) ? sector : null,
                (symbol != null && !symbol.isBlank()) ? symbol : null,
                pageable).map(this::toScoreResponse);
    }

    @Transactional(readOnly = true)
    public List<LocalDate> getAvailableDates() {
        return scoreRepository.findDistinctScoreDates();
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableSectors() {
        return scoreRepository.findDistinctSectors();
    }

    @Transactional(readOnly = true)
    public List<MomentumUploadSummary> listUploads() {
        return uploadRepository.findAllByOrderByUploadedAtDesc()
                .stream().map(this::toUploadSummary).toList();
    }

    // ---- Trending Report ---------------------------------------------------

    /**
     * Returns stocks whose score is >= minScore on EVERY selected date and is
     * strictly increasing day-over-day across those dates.
     *
     * Date resolution (mutually exclusive; dateFrom/dateTo wins if both supplied):
     *   - dateFrom + dateTo: use all distinct score dates between those two dates
     *   - lastNDays only:    use the last N distinct score dates in the DB
     */
    @Transactional(readOnly = true)
    public List<TrendingStockResponse> getTrendingStocks(
            int lastNDays, BigDecimal minScore, LocalDate dateFrom, LocalDate dateTo) {

        List<LocalDate> datesAsc;

        if (dateFrom != null && dateTo != null) {
            datesAsc = scoreRepository.findDatesBetween(dateFrom, dateTo);
        } else {
            if (lastNDays < 2) lastNDays = 2;
            List<LocalDate> recentDates = scoreRepository.findRecentDates(lastNDays);
            datesAsc = new ArrayList<>(recentDates);
            Collections.sort(datesAsc);
        }

        if (datesAsc.size() < 2) return Collections.emptyList();

        List<MomentumScore> candidates =
                scoreRepository.findByScoreDateInAndScoreGreaterThanEqual(datesAsc, minScore);

        Map<String, List<MomentumScore>> bySymbol = candidates.stream()
                .collect(Collectors.groupingBy(MomentumScore::getSymbol));

        int required = datesAsc.size();
        return bySymbol.entrySet().stream()
                .filter(entry -> {
                    List<MomentumScore> scores = entry.getValue().stream()
                            .sorted(Comparator.comparing(MomentumScore::getScoreDate)).toList();
                    if (scores.size() < required) return false;
                    Set<LocalDate> covered = scores.stream()
                            .map(MomentumScore::getScoreDate).collect(Collectors.toSet());
                    if (!covered.containsAll(datesAsc)) return false;
                    for (int i = 1; i < scores.size(); i++) {
                        if (scores.get(i).getScore().compareTo(scores.get(i - 1).getScore()) <= 0)
                            return false;
                    }
                    return true;
                })
                .map(entry -> buildTrendingResponse(entry.getValue(), datesAsc))
                .sorted(Comparator.comparing(TrendingStockResponse::latestScore).reversed())
                .toList();
    }

    // ---- Helpers -----------------------------------------------------------

    /**
     * Normalises a CSV header for case-insensitive lookup.
     * Uses hex integer literals (0xFEFF etc.) - source-encoding safe.
     * Strips: BOM (U+FEFF), NBSP (U+00A0), zero-width chars (U+200B-U+200D),
     * replacement char (�), and all ASCII control chars (\p{Cntrl}).
     */
    private String normalizeHeader(String h) {
        if (h == null) return "";
        // Strip BOM (U+FEFF), NBSP (U+00A0), zero-width chars (U+200B-200D),
        // replacement char (U+FFFD), and ASCII control chars - using hex literals
        // so this is source-encoding safe regardless of platform.
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

    private TrendingStockResponse buildTrendingResponse(List<MomentumScore> raw, List<LocalDate> datesAsc) {
        Set<LocalDate> selectedDates = new HashSet<>(datesAsc);
        List<MomentumScore> s = raw.stream()
                .filter(x -> selectedDates.contains(x.getScoreDate()))
                .sorted(Comparator.comparing(MomentumScore::getScoreDate))
                .toList();
        MomentumScore first  = s.get(0);
        MomentumScore latest = s.get(s.size() - 1);
        List<DailyScore> daily = s.stream()
                .map(x -> new DailyScore(x.getScoreDate(), x.getScore())).toList();
        BigDecimal change = latest.getScore().subtract(first.getScore())
                .setScale(4, RoundingMode.HALF_UP);
        return new TrendingStockResponse(latest.getSymbol(), latest.getStockName(),
                latest.getSectorName(), latest.getScore(), latest.getScoreDate(), daily, change);
    }

    private MomentumScoreResponse toScoreResponse(MomentumScore s) {
        return new MomentumScoreResponse(s.getId(), s.getSymbol(), s.getStockName(),
                s.getSectorName(), s.getScore(), s.getScoreDate(), s.getUploadId(),
                s.getCreatedAt(), s.getUpdatedAt());
    }

    private MomentumUploadSummary toUploadSummary(MomentumUpload u) {
        return new MomentumUploadSummary(u.getId(), u.getFileName(), u.getScoreDate(),
                u.getUploadedAt(), u.getInserted(), u.getUpdated(), u.getFailed(), u.getTotalRows());
    }

    private static String col(String[] cols, int idx, String def) {
        return (idx >= 0 && idx < cols.length) ? cols[idx] : def;
    }

    /**
     * Parses one CSV row handling quoted fields and escaped quotes.
     */
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