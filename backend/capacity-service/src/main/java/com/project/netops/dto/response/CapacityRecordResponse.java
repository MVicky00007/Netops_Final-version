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
    private Long siteId;
    private Long interfaceId;
    private Double measuredCapacityMbps;
    private LocalDateTime measuredAt;
    private Long recordedBy;
}
