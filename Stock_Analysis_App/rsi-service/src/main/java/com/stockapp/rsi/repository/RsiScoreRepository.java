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
