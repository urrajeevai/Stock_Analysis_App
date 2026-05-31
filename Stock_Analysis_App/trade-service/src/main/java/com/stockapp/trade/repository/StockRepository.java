package com.stockapp.trade.repository;

import com.stockapp.trade.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findBySymbol(String symbol);

    boolean existsBySymbol(String symbol);

    List<Stock> findByActiveTrueOrderByNameAsc();

    List<Stock> findAllByOrderByNameAsc();

    @Query("SELECT s FROM Stock s WHERE " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(s.symbol) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(s.industry, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(s.isinCode, '')) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Stock> search(@Param("q") String query);
}
