package com.stockapp.momentum.repository;

import com.stockapp.momentum.entity.MomentumScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MomentumScoreRepository extends JpaRepository<MomentumScore, Long> {

    Optional<MomentumScore> findBySymbolAndScoreDate(String symbol, LocalDate scoreDate);

    @Query("SELECT s FROM MomentumScore s WHERE " +
           "(:dateFrom IS NULL OR s.scoreDate >= :dateFrom) AND " +
           "(:dateTo IS NULL OR s.scoreDate <= :dateTo) AND " +
           "(:sector IS NULL OR LOWER(s.sectorName) LIKE LOWER(CONCAT('%', :sector, '%'))) AND " +
           "(:symbol IS NULL OR UPPER(s.symbol) LIKE UPPER(CONCAT('%', :symbol, '%'))) " +
           "ORDER BY s.scoreDate DESC, s.score DESC")
    Page<MomentumScore> findWithFilters(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("sector") String sector,
            @Param("symbol") String symbol,
            Pageable pageable);

    @Query("SELECT s FROM MomentumScore s WHERE s.scoreDate IN :dates AND s.score >= :minScore " +
           "ORDER BY s.symbol ASC, s.scoreDate ASC")
    List<MomentumScore> findByScoreDateInAndScoreGreaterThanEqual(
            @Param("dates") List<LocalDate> dates,
            @Param("minScore") BigDecimal minScore);

    /**
     * SQL-based trending filter using LAG window function (MySQL 8+).
     * Returns only symbols that:
     *   1. Have a record on every date in :dates with score >= :minScore
     *   2. Show strictly-increasing scores across all those dates
     */
    @Query(value = """
            SELECT ms.*
            FROM momentum_scores ms
            WHERE ms.score_date IN (:dates) AND ms.score >= :minScore
              AND ms.symbol IN (
                SELECT symbol FROM (
                  SELECT symbol,
                         COUNT(*) AS total_days,
                         SUM(CASE WHEN prev_score IS NULL OR score > prev_score THEN 1 ELSE 0 END) AS inc_days
                  FROM (
                    SELECT symbol, score, score_date,
                           LAG(score) OVER (PARTITION BY symbol ORDER BY score_date) AS prev_score
                    FROM momentum_scores
                    WHERE score_date IN (:dates) AND score >= :minScore
                  ) windowed
                  GROUP BY symbol
                  HAVING total_days = :dateCount AND inc_days = :dateCount
                ) valid_symbols
              )
            ORDER BY ms.symbol, ms.score_date
            """,
           nativeQuery = true)
    List<MomentumScore> findTrendingByDatesAndMinScore(
            @Param("dates") List<LocalDate> dates,
            @Param("minScore") BigDecimal minScore,
            @Param("dateCount") int dateCount);

    @Query("SELECT DISTINCT s.scoreDate FROM MomentumScore s ORDER BY s.scoreDate DESC")
    List<LocalDate> findDistinctScoreDates();

    @Query(value = "SELECT DISTINCT score_date FROM momentum_scores ORDER BY score_date DESC LIMIT :limit",
           nativeQuery = true)
    List<LocalDate> findRecentDates(@Param("limit") int limit);

    @Query("SELECT DISTINCT s.scoreDate FROM MomentumScore s " +
           "WHERE s.scoreDate BETWEEN :from AND :to ORDER BY s.scoreDate ASC")
    List<LocalDate> findDatesBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT DISTINCT s.sectorName FROM MomentumScore s WHERE s.sectorName IS NOT NULL ORDER BY s.sectorName")
    List<String> findDistinctSectors();
}
