package com.stockapp.rsi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rsi_uploads")
@Getter @Setter @NoArgsConstructor
public class RsiUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "score_date", nullable = false)
    private LocalDate scoreDate;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "uploaded_by", columnDefinition = "VARCHAR(36)")
    private UUID uploadedBy;

    @Column(name = "total_rows")
    private int totalRows;

    @Column(name = "inserted")
    private int inserted;

    @Column(name = "updated")
    private int updated;

    @Column(name = "failed")
    private int failed;
}
