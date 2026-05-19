package com.project.netops.service.impl;

import com.project.netops.aspect.Auditable;
import com.project.netops.dto.request.FaultReportRequest;
import com.project.netops.dto.response.FaultReportResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.FaultReportMapper;
import com.project.netops.model.FaultReport;
import com.project.netops.model.Site;
import com.project.netops.model.User;
import com.project.netops.repository.FaultReportRepository;
import com.project.netops.repository.SiteRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.FaultReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FaultReportServiceImpl implements FaultReportService {

    private final FaultReportRepository faultReportRepository;
    private final UserRepo userRepository;
    private final SiteRepository siteRepository;
    private final FaultReportMapper mapper;

    @Override
    @Transactional
    @Auditable(action = "CREATE_FAULT", resourceType = "FaultReport")
    public FaultReportResponse createFaultReport(FaultReportRequest request) {
        User reporter = userRepository.findById(request.getReportedById().intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site not found"));

        FaultReport report = FaultReport.builder()
                .reportedBy(reporter)
                .site(site)
                .severity(FaultReport.Severity.valueOf(request.getSeverity().toUpperCase()))
                .description(request.getDescription())
                .status(FaultReport.Status.OPEN)
                .build();

        return mapper.toResponse(faultReportRepository.save(report));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FaultReportResponse> getAllFaultReports() {
        return faultReportRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FaultReportResponse updateFaultStatus(Long faultId, String newStatus) {
        FaultReport report = faultReportRepository.findById(faultId)
                .orElseThrow(() -> new ResourceNotFoundException("Fault Report not found"));
        report.setStatus(FaultReport.Status.valueOf(newStatus.toUpperCase()));
        return mapper.toResponse(faultReportRepository.save(report));
    }
}
