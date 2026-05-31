package com.stockapp.performance.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static com.stockapp.performance.config.CacheConfig.*;

@Component
public class TradeServiceClient {

    private static final Logger log = LoggerFactory.getLogger(TradeServiceClient.class);

    @Value("${trade-service.url}")
    private String tradeServiceUrl;

    @Value("${internal.token:internal-default-token-change-me}")
    private String internalToken;

    private final RestTemplate restTemplate;

    public TradeServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    private HttpEntity<Void> internalRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", internalToken);
        return new HttpEntity<>(headers);
    }

    @Cacheable(value = PERF_SUMMARY, key = "#userId + '-CLOSED'")
    public List<Map<String, Object>> getClosedTrades(String userId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(tradeServiceUrl + "/trades/internal/by-user")
                    .queryParam("userId", userId)
                    .queryParam("status", "CLOSED")
                    .toUriString();

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, internalRequest(),
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

    public int countOpenTrades(String userId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(tradeServiceUrl + "/trades/internal/count")
                    .queryParam("userId", userId)
                    .queryParam("status", "OPEN")
                    .toUriString();

            ResponseEntity<Map<String, Long>> response = restTemplate.exchange(
                    url, HttpMethod.GET, internalRequest(),
                    new ParameterizedTypeReference<Map<String, Long>>() {});

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Long count = response.getBody().get("count");
                return count != null ? count.intValue() : 0;
            }
        } catch (Exception e) {
            log.error("Failed to count open trades for user {}: {}", userId, e.getMessage());
        }
        return 0;
    }
}
