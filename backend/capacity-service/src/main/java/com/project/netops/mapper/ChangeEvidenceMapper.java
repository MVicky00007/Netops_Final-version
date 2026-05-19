package com.project.netops.mapper;

import com.project.netops.dto.response.ChangeEvidenceResponse;
import com.project.netops.model.ChangeEvidence;
import org.springframework.stereotype.Component;

@Component
public class ChangeEvidenceMapper {

    public ChangeEvidenceResponse toResponse(ChangeEvidence evidence) {
        return ChangeEvidenceResponse.builder()
                .evidenceId(evidence.getEvidenceId())
                .planId(evidence.getPlan().getPlanId())
                .fileUri(evidence.getFileUri())
                .fileHash(evidence.getFileHash())
                .originalFilename(evidence.getOriginalFilename())
                .uploadedBy(evidence.getUploadedBy().getUserId().longValue())
                .uploadedAt(evidence.getUploadedAt())
                .notes(evidence.getNotes())
                .build();
    }
}
