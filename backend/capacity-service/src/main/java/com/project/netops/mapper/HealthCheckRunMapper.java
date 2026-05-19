package com.project.netops.mapper;

import com.project.netops.dto.response.HealthCheckRunResponse;
import com.project.netops.model.HealthCheckRun;
import org.springframework.stereotype.Component;

@Component
public class HealthCheckRunMapper {

    public HealthCheckRunResponse toResponse(HealthCheckRun run) {
        if (run == null) return null;
        return HealthCheckRunResponse.builder()
                .runId(run.getRunId())
                .checkId(run.getHealthCheck().getCheckId())
                .checkName(run.getHealthCheck().getName())
                .targetId(run.getTargetId())
                .runBy(run.getRunBy().getUserId())
                .runByName(run.getRunBy().getName())
                .runAt(run.getRunAt())
                .result(run.getResult().name())
                .details(run.getDetails())
                .build();
    }
}
