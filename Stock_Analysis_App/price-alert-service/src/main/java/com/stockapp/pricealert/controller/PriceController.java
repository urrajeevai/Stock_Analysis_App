package com.stockapp.pricealert.controller;

import com.stockapp.pricealert.dto.PriceResponse;
import com.stockapp.pricealert.service.PriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/prices")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PriceController {

    private final PriceService priceService;

    /**
     * GET /prices/{ticker}
     * Returns the live price for a single ticker.
     */
    @GetMapping("/{ticker}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PriceResponse> getPrice(@PathVariable String ticker) {
        PriceResponse response = priceService.getPrice(ticker);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /prices/batch?tickers=RELIANCE.NS,TCS.NS
     * Returns live prices for multiple comma-separated tickers.
     */
    @GetMapping("/batch")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PriceResponse>> getBatchPrices(
            @RequestParam String tickers) {
        List<String> tickerList = Arrays.asList(tickers.split(","));
        List<PriceResponse> responses = priceService.getBatchPrices(tickerList);
        return ResponseEntity.ok(responses);
    }
}
