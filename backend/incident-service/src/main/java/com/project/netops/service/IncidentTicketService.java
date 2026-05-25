package com.project.netops.service;

import com.project.netops.dto.request.IncidentTicketRequest;
import com.project.netops.dto.request.TicketAttachmentRequest;
import com.project.netops.dto.response.IncidentTicketResponse;
import com.project.netops.dto.response.SLARecordResponse;
import com.project.netops.dto.response.TicketAttachmentResponse;
import java.util.List;

public interface IncidentTicketService {
    IncidentTicketResponse createTicket(IncidentTicketRequest request);
    List<IncidentTicketResponse> getAllTickets();
    IncidentTicketResponse getTicketById(Long ticketId);
    IncidentTicketResponse updateTicketStatus(Long ticketId, String status, String resolutionNotes);
    IncidentTicketResponse assignTicket(Long ticketId, Long assignedToId);
    TicketAttachmentResponse uploadAttachment(Long ticketId, TicketAttachmentRequest request);
    TicketAttachmentResponse uploadAttachmentFile(Long ticketId, Long uploadedById,
                                                   String description, org.springframework.web.multipart.MultipartFile file);
    org.springframework.core.io.Resource downloadAttachment(Long attachmentId);
    com.project.netops.model.TicketAttachment getAttachment(Long attachmentId);
    List<TicketAttachmentResponse> listAttachments(Long ticketId);
    SLARecordResponse getSlaRecord(Long ticketId);
}
