package com.stockapp.pricealert.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class TradeServiceClient {

    private static final Logger log = LoggerFactory.getLogger(TradeServiceClient.class);

    @Value("${price-polling.trade-service-url}")
    private String tradeServiceUrl;

    private final RestTemplate restTemplate;

    public TradeServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    public List<Map<String, Object>> getOpenTrades() {
        try {
            String url = tradeServiceUrl + "/trades/internal/open-all";
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {});
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (RestClientException e) {
            log.error("Failed to fetch open trades from trade-service: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error fetching open trades: {}", e.getMessage());
        }
        return Collections.emptyList();
    }
}
