package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CapacityRecordResponse {
    private Long capacityId;

    // Site identity
    private Long siteId;
    private String siteCode;
    private String siteName;

    // Interface identity + the interface's plan/rated capacity for context
    private Long interfaceId;
    private String interfaceName;
    private Integer interfaceCapacityMbps;

    // The measurement itself
    private Double measuredCapacityMbps;
    private LocalDateTime measuredAt;

    // Recorder identity
    private Long recordedBy;
    private String recordedByName;
}
