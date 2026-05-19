package com.project.netops.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SLARecordResponse {
    private Long slaId;
    private Long ticketId;
    private LocalDateTime responseDueAt;
    private LocalDateTime resolutionDueAt;
    private Boolean breachFlag;
}
