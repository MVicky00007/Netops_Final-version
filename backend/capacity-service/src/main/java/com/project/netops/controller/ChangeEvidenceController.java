package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.response.ChangeEvidenceResponse;
import com.project.netops.service.ChangeEvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/capacity-plans/{planId}/evidence")
@RequiredArgsConstructor
public class ChangeEvidenceController {

    private final ChangeEvidenceService evidenceService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<APIResponse<ChangeEvidenceResponse>> uploadEvidence(
            @PathVariable Long planId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("uploadedBy") Long uploadedBy,
            @RequestParam(value = "notes", required = false) String notes) {

        ChangeEvidenceResponse saved = evidenceService.uploadEvidence(planId, file, uploadedBy, notes);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(APIResponse.success("Evidence uploaded successfully.", saved));
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<ChangeEvidenceResponse>>> listEvidence(
            @PathVariable Long planId) {
        List<ChangeEvidenceResponse> evidence = evidenceService.listEvidence(planId);
        return ResponseEntity.ok(APIResponse.success(evidence));
    }

    @GetMapping("/{evidenceId}/download")
    public ResponseEntity<Resource> downloadEvidence(
            @PathVariable Long planId,
            @PathVariable Long evidenceId) {
        Resource file = evidenceService.downloadEvidenceFile(evidenceId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }
}
