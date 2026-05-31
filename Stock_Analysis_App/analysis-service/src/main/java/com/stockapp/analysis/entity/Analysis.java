package com.stockapp.analysis.entity;

import com.stockapp.common.enums.AnalysisOutcome;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "analyses",
    indexes = {
        @Index(name = "idx_analyses_user_outcome",  columnList = "user_id, outcome"),
        @Index(name = "idx_analyses_user_date",     columnList = "user_id, analysis_date DESC"),
        @Index(name = "idx_analyses_user_ticker",   columnList = "user_id, ticker")
    }
)
@Getter @Setter @NoArgsConstructor
public class Analysis {

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

    @Column(name = "setup_type", length = 100)
    private String setupType;

    @Column(name = "thesis", columnDefinition = "TEXT")
    private String thesis;

    @Column(name = "expected_direction", length = 10)
    private String expectedDirection;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false, length = 20)
    private AnalysisOutcome outcome = AnalysisOutcome.PENDING;

    @Column(name = "analysis_date", nullable = false)
    private LocalDate analysisDate;

    // Price levels
    @Column(name = "stock_price", precision = 15, scale = 4)
    private BigDecimal stockPrice;

    @Column(name = "risk_price", precision = 15, scale = 4)
    private BigDecimal riskPrice;

    @Column(name = "reward_price", precision = 15, scale = 4)
    private BigDecimal rewardPrice;

    @Column(name = "timeframe", length = 50)
    private String timeframe;

    // Computed R/R fields (stored for querying)
    @Column(name = "risk_amount", precision = 15, scale = 4)
    private BigDecimal riskAmount;

    @Column(name = "reward_amount", precision = 15, scale = 4)
    private BigDecimal rewardAmount;

    @Column(name = "risk_percent", precision = 10, scale = 4)
    private BigDecimal riskPercent;

    @Column(name = "reward_percent", precision = 10, scale = 4)
    private BigDecimal rewardPercent;

    @Column(name = "rr_ratio", precision = 10, scale = 4)
    private BigDecimal rrRatio;

    @Column(name = "buy_decision", length = 5)
    private String buyDecision;

    // Chart images (stored as relative paths)
    @Column(name = "chart_image1", length = 500)
    private String chartImage1;

    @Column(name = "chart_image2", length = 500)
    private String chartImage2;

    @Column(name = "chart_image3", length = 500)
    private String chartImage3;

    @Column(name = "chart_image4", length = 500)
    private String chartImage4;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
