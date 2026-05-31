package com.stockapp.trade.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "stocks")
@Getter @Setter @NoArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stock_id")
    private Long stockId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "symbol", unique = true, nullable = false, length = 30)
    private String symbol;

    @Column(name = "exchange", length = 20)
    private String exchange;

    @Column(name = "industry", length = 200)
    private String industry;

    @Column(name = "series", length = 20)
    private String series;

    @Column(name = "isin_code", length = 20)
    private String isinCode;

    @Column(name = "active")
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;

    @UpdateTimestamp
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
}
