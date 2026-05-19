package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CapacityPlanResponse {
    private Long planId;
    private Long siteId;
    private Long interfaceId;
    private Double currentCapacity;
    private Double proposedCapacity;
    private String reason;
    private Long requestedBy;
    private LocalDateTime requestedAt;
    private String status;
}
