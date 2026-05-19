package com.project.netops.service;

import com.project.netops.dto.request.ReportRequest;
import com.project.netops.dto.response.ReportResponse;
import java.util.List;

public interface ReportService {
    ReportResponse generateReport(ReportRequest request);
    List<ReportResponse> getAllReports();
    List<ReportResponse> getReportsByType(String type);
    ReportResponse getReportById(Long reportId);
}
