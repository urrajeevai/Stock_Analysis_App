package com.stockapp.analysis.service;

import com.stockapp.analysis.dto.*;
import com.stockapp.analysis.entity.Analysis;
import com.stockapp.analysis.repository.AnalysisRepository;
import com.stockapp.common.exception.ApiException;
import com.stockapp.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AnalysisService {

    private final AnalysisRepository analysisRepository;

    @Value("${app.upload.dir:uploads/analyses}")
    private String uploadDir;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    public AnalysisResponse createAnalysis(UUID userId, AnalysisCreateRequest request) {
        log.debug("Creating analysis for user {} ticker {}", userId, request.ticker());

        Analysis analysis = new Analysis();
        analysis.setUserId(userId);
        analysis.setStockId(request.stockId());
        analysis.setTicker(request.ticker().toUpperCase());
        analysis.setSetupType(request.setupType());
        analysis.setThesis(request.thesis());
        analysis.setExpectedDirection(request.expectedDirection());
        analysis.setAnalysisDate(request.analysisDate());
        analysis.setOutcome("PENDING");
        analysis.setStockPrice(request.stockPrice());
        analysis.setRiskPrice(request.riskPrice());
        analysis.setRewardPrice(request.rewardPrice());
        analysis.setTimeframe(request.timeframe());

        computeRR(analysis);

        return toResponse(analysisRepository.save(analysis));
    }

    @Transactional(readOnly = true)
    public Page<AnalysisResponse> listAnalyses(UUID userId, String outcome, String ticker, Pageable pageable) {
        return analysisRepository.findByUserIdWithFilters(userId, outcome, ticker, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysis(UUID id, UUID userId) {
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id.toString()));
        if (!analysis.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to analysis: " + id);
        }
        return toResponse(analysis);
    }

    public AnalysisResponse updateAnalysis(UUID id, UUID userId, AnalysisUpdateRequest request) {
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id.toString()));
        if (!analysis.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to analysis: " + id);
        }

        if (request.stockId() != null)          analysis.setStockId(request.stockId());
        if (request.setupType() != null)        analysis.setSetupType(request.setupType());
        if (request.thesis() != null)           analysis.setThesis(request.thesis());
        if (request.outcome() != null)          analysis.setOutcome(request.outcome().toUpperCase());
        if (request.expectedDirection() != null) analysis.setExpectedDirection(request.expectedDirection());
        if (request.stockPrice() != null)       analysis.setStockPrice(request.stockPrice());
        if (request.riskPrice() != null)        analysis.setRiskPrice(request.riskPrice());
        if (request.rewardPrice() != null)      analysis.setRewardPrice(request.rewardPrice());
        if (request.timeframe() != null)        analysis.setTimeframe(request.timeframe());

        computeRR(analysis);

        return toResponse(analysisRepository.save(analysis));
    }

    public AnalysisResponse setOutcome(UUID id, UUID userId, String outcome) {
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id.toString()));
        if (!analysis.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to analysis: " + id);
        }
        analysis.setOutcome(outcome.toUpperCase());
        log.debug("Set outcome for analysis {} to {}", id, outcome);
        return toResponse(analysisRepository.save(analysis));
    }

    public void deleteAnalysis(UUID id) {
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id.toString()));
        analysisRepository.delete(analysis);
        log.debug("Deleted analysis {}", id);
    }

    // ── IMAGE UPLOAD ─────────────────────────────────────────────────────────

    public AnalysisResponse uploadImage(UUID analysisId, UUID userId, int slot, MultipartFile file) {
        if (slot < 1 || slot > 4) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image slot must be 1–4");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = getExtension(originalFilename);
        if (!Set.of("jpg", "jpeg", "png", "webp").contains(ext.toLowerCase())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP");
        }

        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", analysisId.toString()));
        if (!analysis.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to analysis: " + analysisId);
        }

        try {
            Path dir = Paths.get(uploadDir, analysisId.toString());
            Files.createDirectories(dir);

            String filename = "chart" + slot + "." + ext.toLowerCase();
            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = analysisId + "/" + filename;
            switch (slot) {
                case 1 -> analysis.setChartImage1(relativePath);
                case 2 -> analysis.setChartImage2(relativePath);
                case 3 -> analysis.setChartImage3(relativePath);
                case 4 -> analysis.setChartImage4(relativePath);
            }

            log.debug("Saved chart image slot {} for analysis {}", slot, analysisId);
            return toResponse(analysisRepository.save(analysis));
        } catch (IOException e) {
            log.error("Failed to save image for analysis {}", analysisId, e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save image: " + e.getMessage());
        }
    }

    public AnalysisResponse deleteImage(UUID analysisId, UUID userId, int slot) {
        if (slot < 1 || slot > 4) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image slot must be 1–4");
        }

        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", analysisId.toString()));
        if (!analysis.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to analysis: " + analysisId);
        }

        String relativePath = switch (slot) {
            case 1 -> analysis.getChartImage1();
            case 2 -> analysis.getChartImage2();
            case 3 -> analysis.getChartImage3();
            case 4 -> analysis.getChartImage4();
            default -> null;
        };

        if (relativePath != null) {
            try {
                Files.deleteIfExists(Paths.get(uploadDir, relativePath));
            } catch (IOException e) {
                log.warn("Could not delete image file {}", relativePath, e);
            }
            switch (slot) {
                case 1 -> analysis.setChartImage1(null);
                case 2 -> analysis.setChartImage2(null);
                case 3 -> analysis.setChartImage3(null);
                case 4 -> analysis.setChartImage4(null);
            }
        }

        return toResponse(analysisRepository.save(analysis));
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SetupStatsResponse> getSetupStats(UUID userId) {
        List<Object[]> rawStats = analysisRepository.findSetupStatsByUserId(userId);
        List<SetupStatsResponse> result = new ArrayList<>();

        for (Object[] row : rawStats) {
            String setupType = (String) row[0];
            long total   = ((Number) row[1]).longValue();
            long correct = ((Number) row[2]).longValue();
            long failed  = ((Number) row[3]).longValue();
            long pending = ((Number) row[4]).longValue();

            double winRate = 0.0;
            long decided = correct + failed;
            if (decided > 0) winRate = (double) correct / decided * 100.0;

            result.add(new SetupStatsResponse(setupType, total, correct, failed, pending,
                    Math.round(winRate * 100.0) / 100.0));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTickerStats(UUID userId) {
        List<Object[]> rawStats = analysisRepository.findTickerStatsByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rawStats) {
            String ticker = (String) row[0];
            long total   = ((Number) row[1]).longValue();
            long correct = ((Number) row[2]).longValue();
            long failed  = ((Number) row[3]).longValue();
            long pending = ((Number) row[4]).longValue();

            double winRate = 0.0;
            long decided = correct + failed;
            if (decided > 0) winRate = (double) correct / decided * 100.0;

            Map<String, Object> stats = new HashMap<>();
            stats.put("ticker", ticker);
            stats.put("total", total);
            stats.put("correct", correct);
            stats.put("failed", failed);
            stats.put("pending", pending);
            stats.put("winRate", Math.round(winRate * 100.0) / 100.0);
            result.add(stats);
        }
        return result;
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private void computeRR(Analysis a) {
        BigDecimal sp = a.getStockPrice();
        BigDecimal rp = a.getRiskPrice();
        BigDecimal rwp = a.getRewardPrice();
        String dir = a.getExpectedDirection();

        if (sp == null || rp == null || rwp == null ||
            sp.compareTo(BigDecimal.ZERO) <= 0 || dir == null) {
            // Clear computed fields if inputs are incomplete
            a.setRiskAmount(null);
            a.setRewardAmount(null);
            a.setRiskPercent(null);
            a.setRewardPercent(null);
            a.setRrRatio(null);
            a.setBuyDecision(null);
            return;
        }

        BigDecimal riskAmt;
        BigDecimal rewardAmt;

        if ("LONG".equalsIgnoreCase(dir)) {
            riskAmt   = sp.subtract(rp);
            rewardAmt = rwp.subtract(sp);
        } else { // SHORT
            riskAmt   = rp.subtract(sp);
            rewardAmt = sp.subtract(rwp);
        }

        if (riskAmt.compareTo(BigDecimal.ZERO) <= 0 || rewardAmt.compareTo(BigDecimal.ZERO) <= 0) {
            a.setRiskAmount(null);
            a.setRewardAmount(null);
            a.setRiskPercent(null);
            a.setRewardPercent(null);
            a.setRrRatio(null);
            a.setBuyDecision(null);
            return;
        }

        BigDecimal hundred = BigDecimal.valueOf(100);
        BigDecimal riskPct   = riskAmt.multiply(hundred).divide(sp, 4, RoundingMode.HALF_UP);
        BigDecimal rewardPct = rewardAmt.multiply(hundred).divide(sp, 4, RoundingMode.HALF_UP);
        BigDecimal rrRatio   = rewardAmt.divide(riskAmt, 4, RoundingMode.HALF_UP);

        a.setRiskAmount(riskAmt.setScale(4, RoundingMode.HALF_UP));
        a.setRewardAmount(rewardAmt.setScale(4, RoundingMode.HALF_UP));
        a.setRiskPercent(riskPct);
        a.setRewardPercent(rewardPct);
        a.setRrRatio(rrRatio);
        a.setBuyDecision(rrRatio.compareTo(BigDecimal.valueOf(2)) > 0 ? "YES" : "NO");
    }

    private String toImageUrl(String relativePath) {
        if (relativePath == null) return null;
        return "/api/analyses/images/" + relativePath;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private AnalysisResponse toResponse(Analysis a) {
        return new AnalysisResponse(
                a.getId(),
                a.getUserId(),
                a.getStockId(),
                a.getTicker(),
                a.getSetupType(),
                a.getThesis(),
                a.getExpectedDirection(),
                a.getOutcome(),
                a.getAnalysisDate(),
                a.getStockPrice(),
                a.getRiskPrice(),
                a.getRewardPrice(),
                a.getTimeframe(),
                a.getRiskAmount(),
                a.getRewardAmount(),
                a.getRiskPercent(),
                a.getRewardPercent(),
                a.getRrRatio(),
                a.getBuyDecision(),
                toImageUrl(a.getChartImage1()),
                toImageUrl(a.getChartImage2()),
                toImageUrl(a.getChartImage3()),
                toImageUrl(a.getChartImage4()),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
