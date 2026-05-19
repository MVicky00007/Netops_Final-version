package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.HealthCheckRequest;
import com.project.netops.dto.request.HealthCheckRunRequest;
import com.project.netops.dto.response.HealthCheckResponse;
import com.project.netops.dto.response.HealthCheckRunResponse;
import com.project.netops.service.HealthCheckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/health-checks")
@RequiredArgsConstructor
public class HealthCheckController {

    private final HealthCheckService healthCheckService;

    @PostMapping
    public ResponseEntity<APIResponse<HealthCheckResponse>> createHealthCheck(
            @Valid @RequestBody HealthCheckRequest request) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "Health check created", healthCheckService.createHealthCheck(request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<HealthCheckResponse>>> getAllHealthChecks() {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched health checks", healthCheckService.getAllHealthChecks()));
    }

    @GetMapping("/active")
    public ResponseEntity<APIResponse<List<HealthCheckResponse>>> getActiveHealthChecks() {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched active health checks", healthCheckService.getActiveHealthChecks()));
    }

    @GetMapping("/{checkId}")
    public ResponseEntity<APIResponse<HealthCheckResponse>> getHealthCheckById(@PathVariable Long checkId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched health check", healthCheckService.getHealthCheckById(checkId)));
    }

    @PutMapping("/{checkId}")
    public ResponseEntity<APIResponse<HealthCheckResponse>> updateHealthCheck(
            @PathVariable Long checkId,
            @Valid @RequestBody HealthCheckRequest request) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Health check updated", healthCheckService.updateHealthCheck(checkId, request)));
    }

    @PostMapping("/run")
    public ResponseEntity<APIResponse<HealthCheckRunResponse>> runHealthCheck(
            @Valid @RequestBody HealthCheckRunRequest request) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "Health check executed", healthCheckService.runHealthCheck(request)),
                HttpStatus.CREATED);
    }

    @GetMapping("/{checkId}/runs")
    public ResponseEntity<APIResponse<List<HealthCheckRunResponse>>> getRunsByCheckId(@PathVariable Long checkId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched runs", healthCheckService.getRunsByCheckId(checkId)));
    }
}
