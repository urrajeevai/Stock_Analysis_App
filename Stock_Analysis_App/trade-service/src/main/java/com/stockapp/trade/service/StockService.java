package com.stockapp.trade.service;

import com.stockapp.common.exception.ApiException;
import com.stockapp.common.exception.ResourceNotFoundException;
import com.stockapp.trade.dto.*;
import com.stockapp.trade.entity.Stock;
import com.stockapp.trade.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StockService {

    private final StockRepository stockRepository;

    @Transactional(readOnly = true)
    public List<StockDto> listStocks(boolean activeOnly) {
        List<Stock> stocks = activeOnly
                ? stockRepository.findByActiveTrueOrderByNameAsc()
                : stockRepository.findAllByOrderByNameAsc();
        return stocks.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public StockDto getStock(Long stockId) {
        return toDto(stockRepository.findById(stockId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock", stockId.toString())));
    }

    @Transactional(readOnly = true)
    public StockDto getStockBySymbol(String symbol) {
        return toDto(stockRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Stock", symbol)));
    }

    @Transactional(readOnly = true)
    public List<StockDto> searchStocks(String query) {
        return stockRepository.search(query).stream().map(this::toDto).toList();
    }

    public StockDto createStock(CreateStockRequest request) {
        String symbol = request.symbol().toUpperCase();
        if (stockRepository.existsBySymbol(symbol)) {
            throw new ApiException(HttpStatus.CONFLICT, "Stock already exists with symbol: " + symbol);
        }
        Stock stock = new Stock();
        stock.setName(request.name());
        stock.setSymbol(symbol);
        stock.setExchange(request.exchange());
        stock.setIndustry(request.industry());
        stock.setSeries(request.series());
        stock.setIsinCode(request.isinCode());
        stock.setActive(true);
        return toDto(stockRepository.save(stock));
    }

    public StockDto updateStock(Long stockId, UpdateStockRequest request) {
        Stock stock = stockRepository.findById(stockId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock", stockId.toString()));
        if (request.name() != null) stock.setName(request.name());
        if (request.symbol() != null) {
            String symbol = request.symbol().toUpperCase();
            if (!symbol.equals(stock.getSymbol()) && stockRepository.existsBySymbol(symbol)) {
                throw new ApiException(HttpStatus.CONFLICT, "Symbol already in use: " + symbol);
            }
            stock.setSymbol(symbol);
        }
        if (request.exchange() != null) stock.setExchange(request.exchange());
        if (request.industry() != null) stock.setIndustry(request.industry());
        if (request.series() != null) stock.setSeries(request.series());
        if (request.isinCode() != null) stock.setIsinCode(request.isinCode());
        if (request.active() != null) stock.setActive(request.active());
        return toDto(stockRepository.save(stock));
    }

    public void deleteStock(Long stockId) {
        Stock stock = stockRepository.findById(stockId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock", stockId.toString()));
        stockRepository.delete(stock);
    }

    // ── CSV bulk upsert ──────────────────────────────────────────────────────

    /**
     * Parses a CSV with header: Company Name,Industry,Symbol,Series,ISIN Code
     * Skips the header row. For each data row:
     *   - If a stock with the same symbol already exists → UPDATE name/industry/series/isinCode
     *   - Otherwise → INSERT a new stock (exchange defaults to "NSE")
     * Returns a summary of inserted/updated/failed counts and per-row error messages.
     */
    @Transactional
    public CsvUploadResult uploadFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CSV file is empty");
        }
        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".csv")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only .csv files are accepted");
        }

        int inserted = 0, updated = 0, failed = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine(); // skip header
            if (headerLine == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "CSV file has no content");
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

                if (cols.length < 5) {
                    errors.add("Row " + lineNum + ": expected 5 columns, found " + cols.length);
                    failed++;
                    continue;
                }

                String companyName = cols[0].trim();
                String industry    = cols[1].trim();
                String symbol      = cols[2].trim().toUpperCase();
                String series      = cols[3].trim();
                String isinCode    = cols[4].trim();

                if (symbol.isEmpty()) {
                    errors.add("Row " + lineNum + ": Symbol is blank — skipped");
                    failed++;
                    continue;
                }
                if (companyName.isEmpty()) {
                    errors.add("Row " + lineNum + " (" + symbol + "): Company Name is blank — skipped");
                    failed++;
                    continue;
                }

                try {
                    Optional<Stock> existing = stockRepository.findBySymbol(symbol);
                    if (existing.isPresent()) {
                        Stock s = existing.get();
                        s.setName(companyName);
                        if (!industry.isEmpty()) s.setIndustry(industry);
                        if (!series.isEmpty()) s.setSeries(series);
                        if (!isinCode.isEmpty()) s.setIsinCode(isinCode);
                        s.setActive(true);
                        stockRepository.save(s);
                        updated++;
                    } else {
                        Stock s = new Stock();
                        s.setName(companyName);
                        s.setSymbol(symbol);
                        s.setExchange("NSE");
                        s.setIndustry(industry.isEmpty() ? null : industry);
                        s.setSeries(series.isEmpty() ? null : series);
                        s.setIsinCode(isinCode.isEmpty() ? null : isinCode);
                        s.setActive(true);
                        stockRepository.save(s);
                        inserted++;
                    }
                } catch (Exception e) {
                    log.warn("Row {} ({}): {}", lineNum, symbol, e.getMessage());
                    errors.add("Row " + lineNum + " (" + symbol + "): " + e.getMessage());
                    failed++;
                }
            }

        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot read CSV file: " + e.getMessage());
        }

        log.info("CSV upload complete — inserted={} updated={} failed={}", inserted, updated, failed);
        return new CsvUploadResult(inserted, updated, failed, inserted + updated + failed, errors);
    }

    // ── CSV parsing ──────────────────────────────────────────────────────────

    /**
     * Parses a single CSV row handling:
     * - Comma-delimited fields
     * - Double-quoted fields (quotes escaped as "" inside a quoted field)
     * - Whitespace trimming of unquoted fields
     */
    static String[] parseCsvRow(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }

    // ── DTO mapping ──────────────────────────────────────────────────────────

    private StockDto toDto(Stock s) {
        return new StockDto(
                s.getStockId(), s.getName(), s.getSymbol(), s.getExchange(),
                s.getIndustry(), s.getSeries(), s.getIsinCode(),
                s.isActive(), s.getCreatedTime(), s.getUpdatedTime()
        );
    }
}
