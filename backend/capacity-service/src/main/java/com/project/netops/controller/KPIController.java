package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.KPIRequest;
import com.project.netops.dto.response.KPIResponse;
import com.project.netops.service.KPIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpis")
@RequiredArgsConstructor
public class KPIController {

    private final KPIService kpiService;

    @PostMapping
    public ResponseEntity<APIResponse<KPIResponse>> createKPI(
            @Valid @RequestBody KPIRequest request) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "KPI created", kpiService.createKPI(request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<KPIResponse>>> getAllKPIs() {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched KPIs", kpiService.getAllKPIs()));
    }

    @GetMapping("/{kpiId}")
    public ResponseEntity<APIResponse<KPIResponse>> getKPIById(@PathVariable Long kpiId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched KPI", kpiService.getKPIById(kpiId)));
    }

    @PutMapping("/{kpiId}")
    public ResponseEntity<APIResponse<KPIResponse>> updateKPI(
            @PathVariable Long kpiId,
            @Valid @RequestBody KPIRequest request) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "KPI updated", kpiService.updateKPI(kpiId, request)));
    }
}
