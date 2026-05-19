package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.CapacityRecordRequest;
import com.project.netops.dto.response.CapacityRecordResponse;
import com.project.netops.service.CapacityRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/capacity-records")
@RequiredArgsConstructor
public class CapacityRecordController {

    private final CapacityRecordService recordService;

    @PostMapping
    public ResponseEntity<APIResponse<CapacityRecordResponse>> recordMeasurement(
            @Valid @RequestBody CapacityRecordRequest req) {

        CapacityRecordResponse saved = recordService.recordMeasurement(
                req.getSiteId(), req.getInterfaceId(),
                req.getMeasuredCapacityMbps(), req.getRecordedBy());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(APIResponse.success("Capacity recorded successfully.", saved));
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<CapacityRecordResponse>>> listRecords(
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long interfaceId) {

        List<CapacityRecordResponse> records = recordService.listRecords(siteId, interfaceId);
        return ResponseEntity.ok(APIResponse.success(records));
    }
}
