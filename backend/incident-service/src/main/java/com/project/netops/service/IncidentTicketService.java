package com.project.netops.service;

import com.project.netops.dto.request.IncidentTicketRequest;
import com.project.netops.dto.response.IncidentTicketResponse;
import com.project.netops.dto.response.SLARecordResponse;
import java.util.List;

public interface IncidentTicketService {
    IncidentTicketResponse createTicket(IncidentTicketRequest request);
    List<IncidentTicketResponse> getAllTickets();
    IncidentTicketResponse getTicketById(Long ticketId);
    IncidentTicketResponse updateTicketStatus(Long ticketId, String status, String resolutionNotes);
    IncidentTicketResponse assignTicket(Long ticketId, Long assignedToId);
    SLARecordResponse getSlaRecord(Long ticketId);
}
