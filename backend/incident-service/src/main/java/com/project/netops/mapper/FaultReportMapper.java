package com.project.netops.mapper;

import com.project.netops.dto.response.FaultReportResponse;
import com.project.netops.model.FaultReport;
import org.springframework.stereotype.Component;

@Component
public class FaultReportMapper {

    public FaultReportResponse toResponse(FaultReport report) {
        if (report == null) return null;

        return FaultReportResponse.builder()
                .faultId(report.getFaultId())
                .reportedByName(report.getReportedBy().getName())
                .siteName(report.getSite().getName())
                .severity(report.getSeverity().name())
                .description(report.getDescription())
                .status(report.getStatus().name())
                .reportedAt(report.getReportedAt())
                .build();
    }
}
