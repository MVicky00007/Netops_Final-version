package com.project.netops.service;

import com.project.netops.dto.response.ChangeEvidenceResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ChangeEvidenceService {
    ChangeEvidenceResponse uploadEvidence(Long planId, MultipartFile file,
                                          Long uploadedById, String notes);
    List<ChangeEvidenceResponse> listEvidence(Long planId);
    Resource downloadEvidenceFile(Long evidenceId);
}
