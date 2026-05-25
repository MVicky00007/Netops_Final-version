package com.project.netops.service.impl;

import com.project.netops.aspect.Auditable;
import com.project.netops.dto.request.IncidentTicketRequest;
import com.project.netops.dto.request.TicketAttachmentRequest;
import com.project.netops.dto.response.IncidentTicketResponse;
import com.project.netops.dto.response.SLARecordResponse;
import com.project.netops.dto.response.TicketAttachmentResponse;
import com.project.netops.exception.IncidentNotFoundException;
import com.project.netops.exception.InvalidTicketStateException;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.IncidentTicketMapper;
import com.project.netops.model.*;
import com.project.netops.repository.*;
import com.project.netops.service.IncidentTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentTicketServiceImpl implements IncidentTicketService {

    private final IncidentTicketRepository ticketRepository;
    private final FaultReportRepository faultRepository;
    private final UserRepo userRepository;
    private final SLARecordRepository slaRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final IncidentTicketMapper mapper;

    @Override
    @Transactional
    @Auditable(action = "CREATE_TICKET", resourceType = "IncidentTicket")
    public IncidentTicketResponse createTicket(IncidentTicketRequest request) {
        FaultReport fault = faultRepository.findById(request.getFaultId())
                .orElseThrow(() -> new ResourceNotFoundException("Fault not found"));
        User creator = userRepository.findById(request.getCreatedById().intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User assignee = request.getAssignedToId() != null ?
            userRepository.findById(request.getAssignedToId().intValue()).orElse(null) : null;

        IncidentTicket ticket = IncidentTicket.builder()
                .fault(fault)
                .createdBy(creator)
                .assignedTo(assignee)
                .priority(IncidentTicket.Priority.valueOf(request.getPriority().toUpperCase()))
                .status(IncidentTicket.Status.OPEN)
                .build();

        IncidentTicket savedTicket = ticketRepository.save(ticket);

        int resHours = request.getPriority().equalsIgnoreCase("P1") ? 4 : 24;
        SLARecord sla = SLARecord.builder()
                .ticket(savedTicket)
                .responseDueAt(LocalDateTime.now().plusHours(1))
                .resolutionDueAt(LocalDateTime.now().plusHours(resHours))
                .build();
        slaRepository.save(sla);

        return mapper.toTicketResponse(savedTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentTicketResponse> getAllTickets() {
        return ticketRepository.findAll().stream()
                .map(mapper::toTicketResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentTicketResponse getTicketById(Long ticketId) {
        return mapper.toTicketResponse(ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IncidentNotFoundException("Ticket not found with ID: " + ticketId)));
    }

    @Override
    @Transactional
    public IncidentTicketResponse updateTicketStatus(Long ticketId, String status, String notes) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IncidentNotFoundException("Ticket not found with ID: " + ticketId));

        IncidentTicket.Status newStatus;
        try {
            newStatus = IncidentTicket.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidTicketStateException("Invalid status provided. Accepted values are: OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED");
        }

        if (ticket.getStatus() == IncidentTicket.Status.CLOSED) {
            throw new InvalidTicketStateException("Cannot change the status of a CLOSED ticket.");
        }

        ticket.setStatus(newStatus);
        if (notes != null) ticket.setResolutionNotes(notes);

        if (newStatus == IncidentTicket.Status.RESOLVED || newStatus == IncidentTicket.Status.CLOSED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        return mapper.toTicketResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    @Auditable(action = "ASSIGN_TICKET", resourceType = "IncidentTicket")
    public IncidentTicketResponse assignTicket(Long ticketId, Long assignedToId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IncidentNotFoundException("Ticket not found with ID: " + ticketId));

        if (ticket.getStatus() == IncidentTicket.Status.CLOSED) {
            throw new InvalidTicketStateException("Cannot reassign a CLOSED ticket.");
        }

        User assignee = userRepository.findById(assignedToId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + assignedToId));

        ticket.setAssignedTo(assignee);
        return mapper.toTicketResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketAttachmentResponse uploadAttachment(Long ticketId, TicketAttachmentRequest request) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IncidentNotFoundException("Ticket not found with ID: " + ticketId));

        User uploader = userRepository.findById(request.getUploadedById().intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TicketAttachment attachment = TicketAttachment.builder()
                .ticket(ticket)
                .fileUri(request.getFileUri())
                .checksum(request.getChecksum())
                .description(request.getDescription())
                .uploadedBy(uploader)
                .build();

        TicketAttachment saved = attachmentRepository.save(attachment);

        return TicketAttachmentResponse.builder()
                .attachmentId(saved.getAttachmentId())
                .fileUri(saved.getFileUri())
                .description(saved.getDescription())
                .uploadedByName(saved.getUploadedBy().getName())
                .uploadedAt(saved.getUploadedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SLARecordResponse getSlaRecord(Long ticketId) {
        SLARecord sla = slaRepository.findByTicket_TicketId(ticketId)
                .orElseThrow(() -> new IncidentNotFoundException("SLA not found for Ticket ID: " + ticketId));
        return mapper.toSLAResponse(sla);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketAttachmentResponse> listAttachments(Long ticketId) {
        // Confirm the ticket exists first so callers get a 404 (not an empty list)
        // when they pass an invalid ticketId.
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IncidentNotFoundException("Ticket not found with ID: " + ticketId));

        return attachmentRepository.findByTicket_TicketIdOrderByUploadedAtDesc(ticketId).stream()
                .map(a -> TicketAttachmentResponse.builder()
                        .attachmentId(a.getAttachmentId())
                        .fileUri(a.getFileUri())
                        .description(a.getDescription())
                        .uploadedByName(a.getUploadedBy() != null ? a.getUploadedBy().getName() : null)
                        .uploadedAt(a.getUploadedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
