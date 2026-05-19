package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportResponse {
    private Long reportId;
    private String type;
    private String parametersJson;
    private Integer generatedBy;
    private String generatedByName;
    private LocalDateTime generatedAt;
    private String reportUri;
}
