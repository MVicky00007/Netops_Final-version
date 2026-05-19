package com.project.netops.service;

import com.project.netops.dto.request.FaultReportRequest;
import com.project.netops.dto.response.FaultReportResponse;
import java.util.List;

public interface FaultReportService {
    FaultReportResponse createFaultReport(FaultReportRequest request);
    List<FaultReportResponse> getAllFaultReports();
    FaultReportResponse updateFaultStatus(Long faultId, String newStatus);
}
