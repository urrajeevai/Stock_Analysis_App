package com.stockapp.trade.repository;

import com.stockapp.trade.entity.TradeTrail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TradeTrailRepository extends JpaRepository<TradeTrail, UUID> {

    List<TradeTrail> findByTradeIdOrderByCreatedAtAsc(UUID tradeId);

    List<TradeTrail> findByTradeIdOrderByCreatedAtDesc(UUID tradeId);

    void deleteByTradeId(UUID tradeId);
}
