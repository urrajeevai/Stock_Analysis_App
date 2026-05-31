package com.stockapp.trade.entity;

import com.stockapp.common.enums.Direction;
import com.stockapp.common.enums.TradeOutcome;
import com.stockapp.common.enums.TradeStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "trades",
    indexes = {
        @Index(name = "idx_trades_user_status",    columnList = "user_id, status"),
        @Index(name = "idx_trades_user_createdat", columnList = "user_id, created_at DESC"),
        @Index(name = "idx_trades_analysis_id",    columnList = "analysis_id"),
        @Index(name = "idx_trades_closed_at",      columnList = "user_id, closed_at DESC")
    }
)
@Getter @Setter @NoArgsConstructor
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID userId;

    @Column(name = "stock_id")
    private Long stockId;

    @Column(name = "ticker", nullable = false, length = 30)
    private String ticker;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    private Direction direction = Direction.LONG;

    @Column(name = "entry_price", nullable = false, precision = 15, scale = 4)
    private BigDecimal entryPrice;

    @Column(name = "stop_loss", nullable = false, precision = 15, scale = 4)
    private BigDecimal stopLoss;

    @Column(name = "target_price", nullable = false, precision = 15, scale = 4)
    private BigDecimal targetPrice;

    @Column(name = "rr_ratio", precision = 8, scale = 4)
    private BigDecimal rrRatio;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TradeStatus status = TradeStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", length = 20)
    private TradeOutcome outcome;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "setup_type", length = 100)
    private String setupType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "actual_exit_price", precision = 15, scale = 4)
    private BigDecimal actualExitPrice;

    @Column(name = "analysis_id", columnDefinition = "VARCHAR(36)")
    private UUID analysisId;

    @Column(name = "quantity", precision = 15, scale = 4)
    private BigDecimal quantity;
}
