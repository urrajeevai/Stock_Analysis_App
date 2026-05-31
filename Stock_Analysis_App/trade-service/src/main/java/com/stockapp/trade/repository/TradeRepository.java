package com.stockapp.trade.repository;

import com.stockapp.common.enums.TradeStatus;
import com.stockapp.trade.entity.Trade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TradeRepository extends JpaRepository<Trade, UUID> {

    List<Trade> findByUserIdAndStatus(UUID userId, TradeStatus status);

    List<Trade> findByStatus(TradeStatus status);

    @Query("SELECT t FROM Trade t WHERE t.userId = :userId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:ticker IS NULL OR UPPER(t.ticker) = UPPER(:ticker))")
    Page<Trade> findByUserIdWithFilters(@Param("userId") UUID userId,
                                        @Param("status") String status,
                                        @Param("ticker") String ticker,
                                        Pageable pageable);

    @Query("SELECT COUNT(t) FROM Trade t WHERE t.userId = :userId AND t.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") TradeStatus status);

    @Query("SELECT COUNT(t) FROM Trade t WHERE t.status = :status")
    long countByStatus(@Param("status") TradeStatus status);

    List<Trade> findByAnalysisId(UUID analysisId);

    List<Trade> findByUserIdAndStatusOrderByClosedAtDesc(UUID userId, TradeStatus status);

    List<Trade> findByUserIdAndStatusAndClosedAtAfterOrderByClosedAtDesc(UUID userId, TradeStatus status, Instant since);
}
