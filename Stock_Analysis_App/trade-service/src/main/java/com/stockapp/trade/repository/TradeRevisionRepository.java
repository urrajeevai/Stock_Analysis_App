package com.stockapp.trade.repository;

import com.stockapp.trade.entity.TradeRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TradeRevisionRepository extends JpaRepository<TradeRevision, UUID> {

    List<TradeRevision> findByTradeIdOrderByRevisedAtDesc(UUID tradeId);
}
