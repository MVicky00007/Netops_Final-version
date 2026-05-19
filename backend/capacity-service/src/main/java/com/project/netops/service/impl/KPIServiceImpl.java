package com.project.netops.service.impl;

import com.project.netops.dto.request.KPIRequest;
import com.project.netops.dto.response.KPIResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.KPIMapper;
import com.project.netops.model.KPI;
import com.project.netops.repository.KPIRepository;
import com.project.netops.service.KPIService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KPIServiceImpl implements KPIService {

    private final KPIRepository kpiRepository;
    private final KPIMapper kpiMapper;

    @Override
    @Transactional
    public KPIResponse createKPI(KPIRequest request) {
        KPI kpi = KPI.builder()
                .name(request.getName())
                .definition(request.getDefinition())
                .targetValue(request.getTargetValue())
                .currentValue(request.getCurrentValue())
                .reportingPeriod(request.getReportingPeriod())
                .build();

        return kpiMapper.toResponse(kpiRepository.save(kpi));
    }

    @Override
    @Transactional(readOnly = true)
    public List<KPIResponse> getAllKPIs() {
        return kpiRepository.findAll().stream()
                .map(kpiMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public KPIResponse getKPIById(Long kpiId) {
        KPI kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found with id: " + kpiId));
        return kpiMapper.toResponse(kpi);
    }

    @Override
    @Transactional
    public KPIResponse updateKPI(Long kpiId, KPIRequest request) {
        KPI kpi = kpiRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found with id: " + kpiId));

        if (request.getName() != null) kpi.setName(request.getName());
        if (request.getDefinition() != null) kpi.setDefinition(request.getDefinition());
        if (request.getTargetValue() != null) kpi.setTargetValue(request.getTargetValue());
        if (request.getCurrentValue() != null) kpi.setCurrentValue(request.getCurrentValue());
        if (request.getReportingPeriod() != null) kpi.setReportingPeriod(request.getReportingPeriod());

        return kpiMapper.toResponse(kpiRepository.save(kpi));
    }
}
