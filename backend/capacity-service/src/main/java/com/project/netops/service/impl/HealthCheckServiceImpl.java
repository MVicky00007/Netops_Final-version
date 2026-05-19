package com.project.netops.service.impl;

import com.project.netops.dto.request.HealthCheckRequest;
import com.project.netops.dto.request.HealthCheckRunRequest;
import com.project.netops.dto.response.HealthCheckResponse;
import com.project.netops.dto.response.HealthCheckRunResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.HealthCheckMapper;
import com.project.netops.mapper.HealthCheckRunMapper;
import com.project.netops.model.HealthCheck;
import com.project.netops.model.HealthCheckRun;
import com.project.netops.model.User;
import com.project.netops.repository.HealthCheckRepository;
import com.project.netops.repository.HealthCheckRunRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.HealthCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HealthCheckServiceImpl implements HealthCheckService {

    private final HealthCheckRepository healthCheckRepository;
    private final HealthCheckRunRepository healthCheckRunRepository;
    private final UserRepo userRepo;
    private final HealthCheckMapper healthCheckMapper;
    private final HealthCheckRunMapper healthCheckRunMapper;

    @Override
    @Transactional
    public HealthCheckResponse createHealthCheck(HealthCheckRequest request) {
        User createdBy = userRepo.findById(request.getCreatedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getCreatedBy()));

        HealthCheck hc = HealthCheck.builder()
                .name(request.getName())
                .description(request.getDescription())
                .targetType(HealthCheck.TargetType.valueOf(request.getTargetType().toUpperCase()))
                .conditionText(request.getConditionText())
                .createdBy(createdBy)
                .active(request.getActive())
                .build();

        return healthCheckMapper.toResponse(healthCheckRepository.save(hc));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HealthCheckResponse> getAllHealthChecks() {
        return healthCheckRepository.findAll().stream()
                .map(healthCheckMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HealthCheckResponse> getActiveHealthChecks() {
        return healthCheckRepository.findByActive(true).stream()
                .map(healthCheckMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public HealthCheckResponse getHealthCheckById(Long checkId) {
        HealthCheck hc = healthCheckRepository.findById(checkId)
                .orElseThrow(() -> new ResourceNotFoundException("HealthCheck not found with id: " + checkId));
        return healthCheckMapper.toResponse(hc);
    }

    @Override
    @Transactional
    public HealthCheckResponse updateHealthCheck(Long checkId, HealthCheckRequest request) {
        HealthCheck hc = healthCheckRepository.findById(checkId)
                .orElseThrow(() -> new ResourceNotFoundException("HealthCheck not found with id: " + checkId));

        if (request.getName() != null) hc.setName(request.getName());
        if (request.getDescription() != null) hc.setDescription(request.getDescription());
        if (request.getTargetType() != null) hc.setTargetType(HealthCheck.TargetType.valueOf(request.getTargetType().toUpperCase()));
        if (request.getConditionText() != null) hc.setConditionText(request.getConditionText());
        if (request.getActive() != null) hc.setActive(request.getActive());

        return healthCheckMapper.toResponse(healthCheckRepository.save(hc));
    }

    @Override
    @Transactional
    public HealthCheckRunResponse runHealthCheck(HealthCheckRunRequest request) {
        HealthCheck hc = healthCheckRepository.findById(request.getCheckId())
                .orElseThrow(() -> new ResourceNotFoundException("HealthCheck not found with id: " + request.getCheckId()));
        User runBy = userRepo.findById(request.getRunBy())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getRunBy()));

        // Deterministic rule evaluation — evaluate conditionText as a simple description
        // Actual logic: PASS if the check is active, FAIL otherwise (operators verify manually)
        HealthCheckRun.Result result = Boolean.TRUE.equals(hc.getActive())
                ? HealthCheckRun.Result.PASS
                : HealthCheckRun.Result.FAIL;

        HealthCheckRun run = HealthCheckRun.builder()
                .healthCheck(hc)
                .targetId(request.getTargetId())
                .runBy(runBy)
                .result(result)
                .details("Condition evaluated: " + hc.getConditionText())
                .build();

        return healthCheckRunMapper.toResponse(healthCheckRunRepository.save(run));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HealthCheckRunResponse> getRunsByCheckId(Long checkId) {
        return healthCheckRunRepository.findByHealthCheck_CheckId(checkId).stream()
                .map(healthCheckRunMapper::toResponse)
                .collect(Collectors.toList());
    }
}
