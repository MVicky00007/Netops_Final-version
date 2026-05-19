package com.project.netops.service;

import com.project.netops.dto.request.KPIRequest;
import com.project.netops.dto.response.KPIResponse;
import java.util.List;

public interface KPIService {
    KPIResponse createKPI(KPIRequest request);
    List<KPIResponse> getAllKPIs();
    KPIResponse getKPIById(Long kpiId);
    KPIResponse updateKPI(Long kpiId, KPIRequest request);
}
