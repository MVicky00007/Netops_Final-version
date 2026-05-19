package com.project.netops.service;

import com.project.netops.dto.request.HealthCheckRequest;
import com.project.netops.dto.request.HealthCheckRunRequest;
import com.project.netops.dto.response.HealthCheckResponse;
import com.project.netops.dto.response.HealthCheckRunResponse;
import java.util.List;

public interface HealthCheckService {
    HealthCheckResponse createHealthCheck(HealthCheckRequest request);
    List<HealthCheckResponse> getAllHealthChecks();
    List<HealthCheckResponse> getActiveHealthChecks();
    HealthCheckResponse getHealthCheckById(Long checkId);
    HealthCheckResponse updateHealthCheck(Long checkId, HealthCheckRequest request);
    HealthCheckRunResponse runHealthCheck(HealthCheckRunRequest request);
    List<HealthCheckRunResponse> getRunsByCheckId(Long checkId);
}
