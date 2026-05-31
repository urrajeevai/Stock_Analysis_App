package com.stockapp.pricealert.repository;

import com.stockapp.pricealert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {

    List<Alert> findByUserIdOrderByTriggeredAtDesc(UUID userId);

    List<Alert> findByUserIdAndAcknowledgedFalseOrderByTriggeredAtDesc(UUID userId);

    boolean existsByTradeIdAndAlertTypeAndAcknowledgedFalse(UUID tradeId, String alertType);

    void deleteByTradeId(UUID tradeId);

    List<Alert> findByTradeIdIn(List<UUID> tradeIds);
}
