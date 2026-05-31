package com.stockapp.performance.repository;

import com.stockapp.performance.entity.PerformanceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PerformanceSnapshotRepository extends JpaRepository<PerformanceSnapshot, UUID> {

    List<PerformanceSnapshot> findByUserIdAndPeriodTypeOrderByPeriodStartDesc(UUID userId, String periodType);

    List<PerformanceSnapshot> findByUserIdAndPeriodType(UUID userId, String periodType);

    void deleteByUserIdAndPeriodType(UUID userId, String periodType);
}
