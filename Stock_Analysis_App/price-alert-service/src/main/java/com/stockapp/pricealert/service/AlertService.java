package com.stockapp.pricealert.service;

import com.stockapp.common.exception.ApiException;
import com.stockapp.pricealert.dto.AlertResponse;
import com.stockapp.pricealert.entity.Alert;
import com.stockapp.pricealert.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    public List<AlertResponse> getAlertsForUser(UUID userId) {
        return alertRepository.findByUserIdOrderByTriggeredAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AlertResponse> getUnacknowledgedAlertsForUser(UUID userId) {
        return alertRepository.findByUserIdAndAcknowledgedFalseOrderByTriggeredAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertResponse acknowledge(UUID alertId, UUID userId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Alert not found: " + alertId));

        if (!alert.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized to acknowledge this alert");
        }

        alert.setAcknowledged(true);
        Alert saved = alertRepository.save(alert);
        return toResponse(saved);
    }

    @Transactional
    public void deleteAlert(UUID alertId, UUID userId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Alert not found: " + alertId));

        if (!alert.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized to delete this alert");
        }

        alertRepository.delete(alert);
    }

    private AlertResponse toResponse(Alert alert) {
        return new AlertResponse(
                alert.getId(),
                alert.getTradeId(),
                alert.getUserId(),
                alert.getTicker(),
                alert.getAlertType(),
                alert.getThresholdPct(),
                alert.getPriceAtTrigger(),
                alert.getTriggeredAt(),
                alert.isAcknowledged()
        );
    }
}
