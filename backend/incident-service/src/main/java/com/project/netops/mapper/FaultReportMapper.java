package com.project.netops.mapper;

import com.project.netops.dto.response.FaultReportResponse;
import com.project.netops.model.FaultReport;
import org.springframework.stereotype.Component;

@Component
public class FaultReportMapper {

    public FaultReportResponse toResponse(FaultReport report) {
        if (report == null) return null;

        var b = FaultReportResponse.builder()
                .faultId(report.getFaultId())
                .reportedById(report.getReportedBy() != null ? report.getReportedBy().getUserId().longValue() : null)
                .reportedByName(report.getReportedBy() != null ? report.getReportedBy().getName() : null)
                .siteId(report.getSite() != null ? report.getSite().getSiteId() : null)
                .siteName(report.getSite() != null ? report.getSite().getName() : null)
                .severity(report.getSeverity().name())
                .description(report.getDescription())
                .status(report.getStatus().name())
                .reportedAt(report.getReportedAt());

        // Optional node
        if (report.getNode() != null) {
            b.nodeId(report.getNode().getNodeId())
             .nodeHostname(report.getNode().getHostname());
        }

        // Optional interface
        if (report.getIface() != null) {
            b.interfaceId(report.getIface().getInterfaceId())
             .interfaceName(report.getIface().getName());
        }

        return b.build();
    }
}
