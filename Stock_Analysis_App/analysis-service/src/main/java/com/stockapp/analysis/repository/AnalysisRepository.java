package com.stockapp.analysis.repository;

import com.stockapp.analysis.entity.Analysis;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, UUID> {

    List<Analysis> findByUserIdOrderByAnalysisDateDesc(UUID userId);

    List<Analysis> findByUserIdAndOutcome(UUID userId, String outcome);

    List<Analysis> findByUserIdAndTicker(UUID userId, String ticker);

    List<Analysis> findByUserIdAndSetupType(UUID userId, String setupType);

    @Query("SELECT a FROM Analysis a WHERE a.userId = :userId " +
           "AND (:outcome IS NULL OR a.outcome = :outcome) " +
           "AND (:ticker IS NULL OR UPPER(a.ticker) = UPPER(:ticker))")
    Page<Analysis> findByUserIdWithFilters(@Param("userId") UUID userId,
                                           @Param("outcome") String outcome,
                                           @Param("ticker") String ticker,
                                           Pageable pageable);

    @Query("SELECT a.setupType, " +
           "COUNT(a), " +
           "SUM(CASE WHEN a.outcome = 'CORRECT' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.outcome = 'FAILED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.outcome = 'PENDING' THEN 1 ELSE 0 END) " +
           "FROM Analysis a WHERE a.userId = :userId AND a.setupType IS NOT NULL " +
           "GROUP BY a.setupType")
    List<Object[]> findSetupStatsByUserId(@Param("userId") UUID userId);

    @Query("SELECT a.ticker, " +
           "COUNT(a), " +
           "SUM(CASE WHEN a.outcome = 'CORRECT' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.outcome = 'FAILED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.outcome = 'PENDING' THEN 1 ELSE 0 END) " +
           "FROM Analysis a WHERE a.userId = :userId " +
           "GROUP BY a.ticker ORDER BY COUNT(a) DESC")
    List<Object[]> findTickerStatsByUserId(@Param("userId") UUID userId);
}
