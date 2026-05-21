package com.project.netops.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FaultReportResponse {
    private Long faultId;

    // Reporter
    private Long   reportedById;
    private String reportedByName;

    // Site
    private Long   siteId;
    private String siteName;

    // Node (optional — a fault may not be tied to a specific node)
    private Long   nodeId;
    private String nodeHostname;

    // Interface (optional)
    private Long   interfaceId;
    private String interfaceName;

    private String severity;
    private String description;
    private String status;
    private LocalDateTime reportedAt;
}
