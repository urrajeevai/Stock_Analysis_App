package com.stockapp.pricealert.controller;

import com.stockapp.common.security.UserPrincipal;
import com.stockapp.pricealert.dto.AlertResponse;
import com.stockapp.pricealert.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AlertController {

    private final AlertService alertService;

    /**
     * GET /alerts
     * Returns all alerts for the authenticated user, newest first.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<AlertResponse>> getAlerts(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<AlertResponse> alerts = alertService.getAlertsForUser(currentUser.getId());
        return ResponseEntity.ok(alerts);
    }

    /**
     * GET /alerts/unacknowledged
     * Returns only unacknowledged alerts for the authenticated user.
     */
    @GetMapping("/unacknowledged")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN', 'VIEWER')")
    public ResponseEntity<List<AlertResponse>> getUnacknowledgedAlerts(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<AlertResponse> alerts = alertService.getUnacknowledgedAlertsForUser(currentUser.getId());
        return ResponseEntity.ok(alerts);
    }

    /**
     * PATCH /alerts/{id}/acknowledge
     * Marks a specific alert as acknowledged.
     */
    @PatchMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    public ResponseEntity<AlertResponse> acknowledgeAlert(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        AlertResponse response = alertService.acknowledge(id, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /alerts/{id}
     * Deletes a specific alert.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRADER', 'ADMIN')")
    public ResponseEntity<Void> deleteAlert(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        alertService.deleteAlert(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
