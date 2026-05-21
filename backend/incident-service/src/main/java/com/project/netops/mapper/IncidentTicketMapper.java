package com.project.netops.mapper;

import com.project.netops.dto.response.IncidentTicketResponse;
import com.project.netops.dto.response.SLARecordResponse;
import com.project.netops.model.IncidentTicket;
import com.project.netops.model.SLARecord;
import org.springframework.stereotype.Component;

@Component
public class IncidentTicketMapper {

    public IncidentTicketResponse toTicketResponse(IncidentTicket ticket) {
        if (ticket == null) return null;

        var b = IncidentTicketResponse.builder()
                .ticketId(ticket.getTicketId())
                .faultId(ticket.getFault().getFaultId())
                .createdByName(ticket.getCreatedBy().getName())
                .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : "Unassigned")
                .priority(ticket.getPriority().name())
                .status(ticket.getStatus().name())
                .createdAt(ticket.getCreatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .resolutionNotes(ticket.getResolutionNotes());

        // Inline SLA so list views don't have to issue per-ticket /sla calls.
        SLARecord sla = ticket.getSlaRecord();
        if (sla != null) {
            b.slaId(sla.getSlaId())
             .slaResponseDueAt(sla.getResponseDueAt())
             .slaResolutionDueAt(sla.getResolutionDueAt())
             .slaBreached(sla.getBreachFlag());
        }

        return b.build();
    }

    public SLARecordResponse toSLAResponse(SLARecord sla) {
        if (sla == null) return null;

        return SLARecordResponse.builder()
                .slaId(sla.getSlaId())
                .ticketId(sla.getTicket().getTicketId())
                .responseDueAt(sla.getResponseDueAt())
                .resolutionDueAt(sla.getResolutionDueAt())
                .breachFlag(sla.getBreachFlag())
                .build();
    }
}
