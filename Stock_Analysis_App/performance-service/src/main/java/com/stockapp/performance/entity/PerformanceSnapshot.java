package com.stockapp.performance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "performance_snapshots",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "period_type", "period_start"})
)
@Getter @Setter @NoArgsConstructor
public class PerformanceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID userId;

    @Column(name = "period_type", nullable = false, length = 20)
    private String periodType;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "win_count")
    private int winCount = 0;

    @Column(name = "loss_count")
    private int lossCount = 0;

    @Column(name = "total_trades")
    private int totalTrades = 0;

    @Column(name = "avg_rr", precision = 8, scale = 4)
    private BigDecimal avgRr;

    @Column(name = "strike_rate", precision = 8, scale = 4)
    private BigDecimal strikeRate;

    @Column(name = "avg_win_rr", precision = 8, scale = 4)
    private BigDecimal avgWinRr;

    @Column(name = "avg_loss_rr", precision = 8, scale = 4)
    private BigDecimal avgLossRr;

    @Column(name = "best_setup_type", length = 100)
    private String bestSetupType;

    @CreationTimestamp
    @Column(name = "computed_at", updatable = false)
    private Instant computedAt;
}
