package com.stockapp.momentum.repository;

import com.stockapp.momentum.entity.MomentumUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MomentumUploadRepository extends JpaRepository<MomentumUpload, Long> {
    List<MomentumUpload> findAllByOrderByUploadedAtDesc();
}
