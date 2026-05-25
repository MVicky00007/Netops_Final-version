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

    // Site identity (id + display fields)
    private Long siteId;
    private String siteCode;
    private String siteName;

    // Interface identity (id + display name)
    private Long interfaceId;
    private String interfaceName;

    private Double currentCapacity;
    private Double proposedCapacity;
    private String reason;

    // Requester identity (id + display name)
    private Long requestedBy;
    private String requestedByName;

    private LocalDateTime requestedAt;
    private String status;
}
