package com.project.netops.mapper;

import com.project.netops.dto.response.HealthCheckResponse;
import com.project.netops.model.HealthCheck;
import org.springframework.stereotype.Component;

@Component
public class HealthCheckMapper {

    public HealthCheckResponse toResponse(HealthCheck hc) {
        if (hc == null) return null;
        return HealthCheckResponse.builder()
                .checkId(hc.getCheckId())
                .name(hc.getName())
                .description(hc.getDescription())
                .targetType(hc.getTargetType().name())
                .conditionText(hc.getConditionText())
                .createdBy(hc.getCreatedBy().getUserId())
                .createdByName(hc.getCreatedBy().getName())
                .active(hc.getActive())
                .build();
    }
}
