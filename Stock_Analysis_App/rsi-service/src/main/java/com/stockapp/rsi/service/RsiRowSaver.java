package com.stockapp.rsi.service;

import com.stockapp.rsi.entity.RsiScore;
import com.stockapp.rsi.repository.RsiScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Per-row upsert in its own REQUIRES_NEW transaction so a bad row never
 * rolls back the rest of the upload.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RsiRowSaver {

    private final RsiScoreRepository rsiScoreRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String upsertRow(String symbol, String stockName, String sector,
                            BigDecimal rsiScore, LocalDate scoreDate,
                            Long uploadId, UUID userId) {

        Optional<RsiScore> existing = rsiScoreRepository.findBySymbolAndScoreDate(symbol, scoreDate);
        if (existing.isPresent()) {
            RsiScore s = existing.get();
            s.setStockName(stockName);
            if (sector != null && !sector.isBlank()) s.setSectorName(sector);
            s.setRsiScore(rsiScore);
            s.setUploadId(uploadId);
            s.setUploadedBy(userId);
            rsiScoreRepository.save(s);
            return "UPDATED";
        }

        RsiScore s = new RsiScore();
        s.setSymbol(symbol);
        s.setStockName(stockName);
        s.setSectorName(sector == null || sector.isBlank() ? null : sector);
        s.setRsiScore(rsiScore);
        s.setScoreDate(scoreDate);
        s.setUploadId(uploadId);
        s.setUploadedBy(userId);
        rsiScoreRepository.save(s);
        return "INSERTED";
    }
}
