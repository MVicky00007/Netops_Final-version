package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.FaultReportRequest;
import com.project.netops.dto.response.FaultReportResponse;
import com.project.netops.service.FaultReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fault-reports")
@RequiredArgsConstructor
public class FaultReportController {

    private final FaultReportService service;

    @PostMapping
    public ResponseEntity<APIResponse<FaultReportResponse>> createFaultReport(
            @Valid @RequestBody FaultReportRequest request) {
        return new ResponseEntity<>(new APIResponse<>("SUCCESS", "Fault reported", service.createFaultReport(request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<FaultReportResponse>>> getAllFaultReports() {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched reports", service.getAllFaultReports()));
    }

    @PatchMapping("/{faultId}")
    public ResponseEntity<APIResponse<FaultReportResponse>> updateFaultStatus(@PathVariable Long faultId,
            @RequestParam String status) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Updated status", service.updateFaultStatus(faultId, status)));
    }
}
