package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeEvidenceResponse {
    private Long evidenceId;
    private Long planId;
    private String fileUri;
    private String fileHash;
    private String originalFilename;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
    private String notes;
}
