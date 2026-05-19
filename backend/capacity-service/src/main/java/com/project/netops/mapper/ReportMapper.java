package com.project.netops.mapper;

import com.project.netops.dto.response.ReportResponse;
import com.project.netops.model.Report;
import org.springframework.stereotype.Component;

@Component
public class ReportMapper {

    public ReportResponse toResponse(Report report) {
        if (report == null) return null;
        return ReportResponse.builder()
                .reportId(report.getReportId())
                .type(report.getType().name())
                .parametersJson(report.getParametersJson())
                .generatedBy(report.getGeneratedBy().getUserId())
                .generatedByName(report.getGeneratedBy().getName())
                .generatedAt(report.getGeneratedAt())
                .reportUri(report.getReportUri())
                .build();
    }
}
