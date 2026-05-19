package com.project.netops.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FaultReportResponse {
    private Long faultId;
    private String reportedByName;
    private String siteName;
    private String severity;
    private String description;
    private String status;
    private LocalDateTime reportedAt;
}
