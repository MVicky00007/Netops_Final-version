package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.ReportRequest;
import com.project.netops.dto.response.ReportResponse;
import com.project.netops.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<APIResponse<ReportResponse>> generateReport(
            @Valid @RequestBody ReportRequest request) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "Report generated", reportService.generateReport(request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<ReportResponse>>> getAllReports() {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched reports", reportService.getAllReports()));
    }

    @GetMapping("/by-type")
    public ResponseEntity<APIResponse<List<ReportResponse>>> getReportsByType(@RequestParam String type) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched reports by type", reportService.getReportsByType(type)));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<APIResponse<ReportResponse>> getReportById(@PathVariable Long reportId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched report", reportService.getReportById(reportId)));
    }
}
