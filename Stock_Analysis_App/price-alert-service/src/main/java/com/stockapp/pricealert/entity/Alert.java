package com.stockapp.pricealert.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alerts")
@Getter @Setter @NoArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "trade_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID tradeId;

    @Column(name = "user_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID userId;

    @Column(name = "ticker", nullable = false, length = 30)
    private String ticker;

    @Column(name = "alert_type", nullable = false, length = 30)
    private String alertType;

    @Column(name = "threshold_pct", precision = 8, scale = 4)
    private BigDecimal thresholdPct = new BigDecimal("2.0");

    @Column(name = "price_at_trigger", precision = 15, scale = 4)
    private BigDecimal priceAtTrigger;

    @CreationTimestamp
    @Column(name = "triggered_at", updatable = false)
    private Instant triggeredAt;

    @Column(name = "acknowledged", nullable = false)
    private boolean acknowledged = false;
}
