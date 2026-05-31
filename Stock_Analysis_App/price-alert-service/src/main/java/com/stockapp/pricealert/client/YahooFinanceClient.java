package com.stockapp.pricealert.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class YahooFinanceClient {

    private static final Logger log = LoggerFactory.getLogger(YahooFinanceClient.class);

    private final RestTemplate restTemplate;

    public YahooFinanceClient() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Fetches the current market price for the given ticker from Yahoo Finance.
     * Returns null if the request fails or the ticker is not found.
     */
    @SuppressWarnings("unchecked")
    public BigDecimal getPrice(String ticker) {
        try {
            String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + ticker;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> chart = (Map<String, Object>) body.get("chart");
                if (chart == null) {
                    log.warn("Yahoo Finance response missing 'chart' for ticker: {}", ticker);
                    return null;
                }
                List<Object> results = (List<Object>) chart.get("result");
                if (results != null && !results.isEmpty()) {
                    Map<String, Object> result = (Map<String, Object>) results.get(0);
                    Map<String, Object> meta = (Map<String, Object>) result.get("meta");
                    if (meta != null) {
                        Object price = meta.get("regularMarketPrice");
                        if (price != null) {
                            return new BigDecimal(price.toString());
                        }
                    }
                }
                log.warn("No price found in Yahoo Finance response for ticker: {}", ticker);
            }
        } catch (Exception e) {
            log.error("Failed to fetch price for ticker {} from Yahoo Finance: {}", ticker, e.getMessage());
        }
        return null;
    }
}
