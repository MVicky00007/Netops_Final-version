package com.project.netops.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class IncidentTicketResponse {
    private Long ticketId;
    private Long faultId;
    private String createdByName;
    private String assignedToName;
    private String priority;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;

    // ── SLA inline (saves a second round-trip per ticket) ──
    private Long          slaId;
    private LocalDateTime slaResponseDueAt;
    private LocalDateTime slaResolutionDueAt;
    private Boolean       slaBreached;
}
