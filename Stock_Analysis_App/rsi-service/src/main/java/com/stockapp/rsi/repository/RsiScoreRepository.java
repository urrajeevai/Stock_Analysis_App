package com.stockapp.rsi.repository;

import com.stockapp.rsi.entity.RsiScore;
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
public interface RsiScoreRepository extends JpaRepository<RsiScore, Long> {

    Optional<RsiScore> findBySymbolAndScoreDate(String symbol, LocalDate scoreDate);

    @Query("SELECT s FROM RsiScore s WHERE " +
           "(:dateFrom IS NULL OR s.scoreDate >= :dateFrom) AND " +
           "(:dateTo IS NULL OR s.scoreDate <= :dateTo) AND " +
           "(:sector IS NULL OR LOWER(s.sectorName) LIKE LOWER(CONCAT('%', :sector, '%'))) AND " +
           "(:symbol IS NULL OR UPPER(s.symbol) LIKE UPPER(CONCAT('%', :symbol, '%'))) " +
           "ORDER BY s.scoreDate DESC, s.rsiScore DESC")
    Page<RsiScore> findWithFilters(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("sector") String sector,
            @Param("symbol") String symbol,
            Pageable pageable);

    @Query("SELECT s FROM RsiScore s WHERE s.scoreDate IN :dates AND s.rsiScore >= :minScore " +
           "ORDER BY s.symbol ASC, s.scoreDate ASC")
    List<RsiScore> findByScoreDateInAndRsiScoreGreaterThanEqual(
            @Param("dates") List<LocalDate> dates,
            @Param("minScore") BigDecimal minScore);

    @Query(value = """
            SELECT rs.*
            FROM rsi_scores rs
            WHERE rs.score_date IN (:dates) AND rs.rsi_score >= :minRsi
              AND rs.symbol IN (
                SELECT symbol FROM (
                  SELECT symbol,
                         COUNT(*) AS total_days,
                         SUM(CASE WHEN prev_rsi IS NULL OR rsi_score > prev_rsi THEN 1 ELSE 0 END) AS inc_days
                  FROM (
                    SELECT symbol, rsi_score, score_date,
                           LAG(rsi_score) OVER (PARTITION BY symbol ORDER BY score_date) AS prev_rsi
                    FROM rsi_scores
                    WHERE score_date IN (:dates) AND rsi_score >= :minRsi
                  ) windowed
                  GROUP BY symbol
                  HAVING total_days = :dateCount AND inc_days = :dateCount
                ) valid_symbols
              )
            ORDER BY rs.symbol, rs.score_date
            """,
           nativeQuery = true)
    List<RsiScore> findTrendingByDatesAndMinRsi(
            @Param("dates") List<LocalDate> dates,
            @Param("minRsi") BigDecimal minRsi,
            @Param("dateCount") int dateCount);

    @Query("SELECT DISTINCT s.scoreDate FROM RsiScore s ORDER BY s.scoreDate DESC")
    List<LocalDate> findDistinctScoreDates();

    @Query(value = "SELECT DISTINCT score_date FROM rsi_scores ORDER BY score_date DESC LIMIT :limit",
           nativeQuery = true)
    List<LocalDate> findRecentDates(@Param("limit") int limit);

    @Query("SELECT DISTINCT s.scoreDate FROM RsiScore s " +
           "WHERE s.scoreDate BETWEEN :from AND :to ORDER BY s.scoreDate ASC")
    List<LocalDate> findDatesBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT DISTINCT s.sectorName FROM RsiScore s WHERE s.sectorName IS NOT NULL ORDER BY s.sectorName")
    List<String> findDistinctSectors();
}
