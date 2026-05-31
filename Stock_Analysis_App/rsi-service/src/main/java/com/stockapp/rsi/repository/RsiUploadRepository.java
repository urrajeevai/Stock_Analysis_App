package com.stockapp.rsi.repository;

import com.stockapp.rsi.entity.RsiUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RsiUploadRepository extends JpaRepository<RsiUpload, Long> {
    List<RsiUpload> findAllByOrderByUploadedAtDesc();
}
