package com.stockapp.momentum.service;

import com.stockapp.momentum.entity.MomentumScore;
import com.stockapp.momentum.repository.MomentumScoreRepository;
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
 * Handles per-row upsert in its own transaction (REQUIRES_NEW).
 *
 * Why a separate bean?  Spring AOP only proxies calls made through the bean
 * reference, not internal calls. Placing @Transactional(REQUIRES_NEW) here
 * ensures each row is committed (or rolled back) independently of the outer
 * upload transaction, so a single bad row cannot corrupt the entire upload.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MomentumRowSaver {

    private final MomentumScoreRepository scoreRepository;

    /**
     * Upserts one momentum score row.
     * Returns "INSERTED" or "UPDATED".
     * Runs in its own transaction — failure here only rolls back this one row.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String upsertRow(String symbol, String stockName, String sector,
                            BigDecimal score, LocalDate scoreDate,
                            Long uploadId, UUID userId) {

        Optional<MomentumScore> existing = scoreRepository.findBySymbolAndScoreDate(symbol, scoreDate);
        if (existing.isPresent()) {
            MomentumScore s = existing.get();
            s.setStockName(stockName);
            if (sector != null && !sector.isBlank()) s.setSectorName(sector);
            s.setScore(score);
            s.setUploadId(uploadId);
            s.setUploadedBy(userId);
            scoreRepository.save(s);
            return "UPDATED";
        }

        MomentumScore s = new MomentumScore();
        s.setSymbol(symbol);
        s.setStockName(stockName);
        s.setSectorName(sector == null || sector.isBlank() ? null : sector);
        s.setScore(score);
        s.setScoreDate(scoreDate);
        s.setUploadId(uploadId);
        s.setUploadedBy(userId);
        scoreRepository.save(s);
        return "INSERTED";
    }
}
