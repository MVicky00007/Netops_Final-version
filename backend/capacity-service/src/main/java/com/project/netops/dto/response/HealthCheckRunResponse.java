package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HealthCheckRunResponse {
    private Long runId;
    private Long checkId;
    private String checkName;
    private Long targetId;
    private Integer runBy;
    private String runByName;
    private LocalDateTime runAt;
    private String result;
    private String details;
}
