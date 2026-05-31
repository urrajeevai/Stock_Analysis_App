package com.stockapp.rsi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "rsi_scores",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_rsi_symbol_date",
        columnNames = {"symbol", "score_date"}
    ),
    indexes = {
        @Index(name = "idx_rsi_score_date",       columnList = "score_date"),
        @Index(name = "idx_rsi_date_rsi",         columnList = "score_date, rsi_score DESC"),
        @Index(name = "idx_rsi_symbol_scoredate", columnList = "symbol, score_date ASC")
    }
)
@Getter @Setter @NoArgsConstructor
public class RsiScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "symbol", nullable = false, length = 30)
    private String symbol;

    @Column(name = "stock_name", nullable = false, length = 300)
    private String stockName;

    @Column(name = "sector_name", length = 200)
    private String sectorName;

    @Column(name = "rsi_score", nullable = false, precision = 10, scale = 4)
    private BigDecimal rsiScore;

    @Column(name = "score_date", nullable = false)
    private LocalDate scoreDate;

    @Column(name = "upload_id")
    private Long uploadId;

    @Column(name = "uploaded_by", columnDefinition = "VARCHAR(36)")
    private UUID uploadedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
