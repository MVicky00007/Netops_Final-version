package com.project.netops.service.impl;

import com.project.netops.dto.request.ReportRequest;
import com.project.netops.dto.response.ReportResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.ReportMapper;
import com.project.netops.model.Report;
import com.project.netops.model.User;
import com.project.netops.repository.ReportRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final UserRepo userRepo;
    private final ReportMapper reportMapper;

    @Override
    @Transactional
    public ReportResponse generateReport(ReportRequest request) {
        User generatedBy = userRepo.findById(request.getGeneratedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getGeneratedBy()));

        Report report = Report.builder()
                .type(Report.ReportType.valueOf(request.getType().toUpperCase()))
                .parametersJson(request.getParametersJson())
                .generatedBy(generatedBy)
                .reportUri(request.getReportUri())
                .build();

        return reportMapper.toResponse(reportRepository.save(report));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream()
                .map(reportMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getReportsByType(String type) {
        return reportRepository.findByType(Report.ReportType.valueOf(type.toUpperCase())).stream()
                .map(reportMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));
        return reportMapper.toResponse(report);
    }
}
