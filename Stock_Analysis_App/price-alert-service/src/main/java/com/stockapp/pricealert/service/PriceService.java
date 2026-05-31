package com.stockapp.pricealert.service;

import com.stockapp.common.exception.ApiException;
import com.stockapp.pricealert.client.YahooFinanceClient;
import com.stockapp.pricealert.dto.PriceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriceService {

    private final YahooFinanceClient yahooFinanceClient;

    public PriceResponse getPrice(String ticker) {
        BigDecimal price = yahooFinanceClient.getPrice(ticker);
        if (price == null) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not fetch price for ticker: " + ticker);
        }
        return new PriceResponse(ticker.toUpperCase(), price, Instant.now());
    }

    public List<PriceResponse> getBatchPrices(List<String> tickers) {
        List<PriceResponse> responses = new ArrayList<>();
        for (String ticker : tickers) {
            String trimmed = ticker.trim();
            if (trimmed.isBlank()) continue;
            BigDecimal price = yahooFinanceClient.getPrice(trimmed);
            // Include even null-price entries so caller knows which failed
            responses.add(new PriceResponse(trimmed.toUpperCase(), price, Instant.now()));
        }
        return responses;
    }
}
