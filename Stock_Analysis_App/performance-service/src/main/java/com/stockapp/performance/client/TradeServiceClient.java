package com.stockapp.performance.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class TradeServiceClient {

    private static final Logger log = LoggerFactory.getLogger(TradeServiceClient.class);

    @Value("${trade-service.url}")
    private String tradeServiceUrl;

    private final RestTemplate restTemplate;

    public TradeServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getClosedTrades(String userId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(tradeServiceUrl + "/trades/internal/by-user")
                    .queryParam("userId", userId)
                    .queryParam("status", "CLOSED")
                    .toUriString();

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (RestClientException e) {
            log.error("Failed to fetch closed trades for user {}: {}", userId, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error fetching closed trades: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllTradesForUser(String userId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(tradeServiceUrl + "/trades/internal/by-user")
                    .queryParam("userId", userId)
                    .toUriString();

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Error fetching all trades for user {}: {}", userId, e.getMessage());
        }
        return Collections.emptyList();
    }

    public int countOpenTrades(String userId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(tradeServiceUrl + "/trades/internal/by-user")
                    .queryParam("userId", userId)
                    .queryParam("status", "OPEN")
                    .toUriString();

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().size();
            }
        } catch (Exception e) {
            log.error("Failed to count open trades for user {}: {}", userId, e.getMessage());
        }
        return 0;
    }
}
