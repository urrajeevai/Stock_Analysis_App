package com.stockapp.trade.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "trade_revisions",
    indexes = {
        @Index(name = "idx_trade_revisions_trade_id", columnList = "trade_id, revised_at DESC")
    }
)
@Getter @Setter @NoArgsConstructor
public class TradeRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "trade_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID tradeId;

    @Column(name = "field_changed", nullable = false, length = 100)
    private String fieldChanged;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @CreationTimestamp
    @Column(name = "revised_at", updatable = false)
    private Instant revisedAt;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
}
