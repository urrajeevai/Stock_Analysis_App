package com.stockapp.trade.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trade_trails")
@Getter @Setter @NoArgsConstructor
public class TradeTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "trade_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID tradeId;

    @Column(name = "previous_stop_loss", precision = 15, scale = 4)
    private BigDecimal previousStopLoss;

    @Column(name = "new_stop_loss", precision = 15, scale = 4)
    private BigDecimal newStopLoss;

    @Column(name = "previous_target", precision = 15, scale = 4)
    private BigDecimal previousTarget;

    @Column(name = "new_target", precision = 15, scale = 4)
    private BigDecimal newTarget;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
