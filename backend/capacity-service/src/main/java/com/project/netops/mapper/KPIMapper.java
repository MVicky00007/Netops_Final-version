package com.project.netops.mapper;

import com.project.netops.dto.response.KPIResponse;
import com.project.netops.model.KPI;
import org.springframework.stereotype.Component;

@Component
public class KPIMapper {

    public KPIResponse toResponse(KPI kpi) {
        if (kpi == null) return null;
        return KPIResponse.builder()
                .kpiId(kpi.getKpiId())
                .name(kpi.getName())
                .definition(kpi.getDefinition())
                .targetValue(kpi.getTargetValue())
                .currentValue(kpi.getCurrentValue())
                .reportingPeriod(kpi.getReportingPeriod())
                .build();
    }
}
