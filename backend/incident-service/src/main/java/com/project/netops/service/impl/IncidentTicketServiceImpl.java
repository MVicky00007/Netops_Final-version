package com.project.netops.service.impl;

import com.project.netops.aspect.Auditable;
import com.project.netops.dto.request.IncidentTicketRequest;
import com.project.netops.dto.response.IncidentTicketResponse;
import com.project.netops.dto.response.SLARecordResponse;
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

import java.time.LocalDate;
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
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final IncidentTicketMapper mapper;

    @Override
    @Transactional
    @Auditable(action = "CREATE_TICKET", resourceType = "IncidentTicket")
    public IncidentTicketResponse createTicket(IncidentTicketRequest request) {
        FaultReport fault = faultRepository.findById(request.getFaultId())
                .orElseThrow(() -> new ResourceNotFoundException("Fault not found"));

        // Business rule: a fault may have only ONE active ticket at a time. If
        // someone tries to open a second one while the first is still open / in
        // progress / pending, reject the request -- the workflow is: resolve
        // the existing ticket first, then (if needed) open a new one.
        boolean alreadyActive = ticketRepository.findByFault_FaultId(fault.getFaultId()).stream()
                .anyMatch(t -> t.getStatus() != IncidentTicket.Status.RESOLVED
                            && t.getStatus() != IncidentTicket.Status.CLOSED);
        if (alreadyActive) {
            throw new InvalidTicketStateException(
                    "Fault #" + fault.getFaultId() + " already has an active ticket. "
                  + "Resolve it before opening a new one.");
        }

        User creator = userRepository.findById(request.getCreatedById().intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Business rule: tickets are field work, so only FIELD_ENGINEER users
        // can be the assignee. Anything else is a workflow mistake.
        User assignee = null;
        if (request.getAssignedToId() != null) {
            assignee = userRepository.findById(request.getAssignedToId().intValue())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            if (assignee.getRole() != User.Role.FIELD_ENGINEER) {
                throw new InvalidTicketStateException(
                        "Tickets can only be assigned to a FIELD_ENGINEER. "
                      + assignee.getName() + " is " + assignee.getRole() + ".");
            }
            if (assignee.getStatus() != User.Status.ACTIVE) {
                throw new InvalidTicketStateException(
                        "Cannot assign ticket to " + assignee.getName()
                      + " — account is " + assignee.getStatus() + ".");
            }
        }

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

        // The triage tasks for this fault have served their purpose -- a
        // ticket now exists. Auto-close them so the other network engineers'
        // dashboards stay clean.
        completeTriageTasksFor(fault.getFaultId());

        // Move the fault from OPEN to IN_PROGRESS now that work is starting.
        if (fault.getStatus() == FaultReport.Status.OPEN) {
            fault.setStatus(FaultReport.Status.IN_PROGRESS);
            faultRepository.save(fault);
        }

        if (assignee != null) {
            createTicketTask(savedTicket, assignee);
        }

        return mapper.toTicketResponse(savedTicket);
    }

    /**
     * Mark every PENDING / IN_PROGRESS "Triage fault #N..." task as COMPLETED
     * once a ticket exists for that fault — the triage decision has been made.
     */
    private void completeTriageTasksFor(Long faultId) {
        String tag = "Triage fault #" + faultId;
        taskRepository.findAll().stream()
                .filter(t -> t.getRelatedEntityId() != null && t.getRelatedEntityId().equals(faultId))
                .filter(t -> t.getDescription() != null && t.getDescription().startsWith(tag))
                .filter(t -> t.getStatus() == Task.Status.PENDING
                          || t.getStatus() == Task.Status.IN_PROGRESS)
                .forEach(t -> {
                    t.setStatus(Task.Status.COMPLETED);
                    taskRepository.save(t);
                });
    }

    /**
     * Build a Task row pointing at the given ticket so it appears in the
     * assignee's My-tasks list, plus a Notification with category=TICKET.
     * Idempotent at the call-site: callers should only invoke this when
     * the assignee actually changes.
     */
    private void createTicketTask(IncidentTicket ticket, User assignee) {
        FaultReport fault = ticket.getFault();
        String location = (fault != null && fault.getSite() != null)
                ? fault.getSite().getName()
                  + (fault.getNode() != null ? " / " + fault.getNode().getHostname() : "")
                : "—";

        Task task = Task.builder()
                .user(assignee)
                .relatedEntityId(ticket.getTicketId())
                .description("Work on ticket #" + ticket.getTicketId() + " (" + ticket.getPriority()
                        + ") at " + location
                        + (fault != null ? ": " + fault.getDescription() : ""))
                .dueDate(LocalDate.now().plusDays(1))
                .status(Task.Status.PENDING)
                .build();
        taskRepository.save(task);

        Notification notif = Notification.builder()
                .user(assignee)
                .entityId(ticket.getTicketId())
                .message("Ticket #" + ticket.getTicketId() + " (" + ticket.getPriority()
                        + ") assigned to you — " + location)
                .category(Notification.Category.TICKET)
                .status(Notification.Status.UNREAD)
                .build();
        notificationRepository.save(notif);
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

        // Same business rule as createTicket — only FIELD_ENGINEER can be the
        // assignee for incident work.
        if (assignee.getRole() != User.Role.FIELD_ENGINEER) {
            throw new InvalidTicketStateException(
                    "Tickets can only be assigned to a FIELD_ENGINEER. "
                  + assignee.getName() + " is " + assignee.getRole() + ".");
        }
        if (assignee.getStatus() != User.Status.ACTIVE) {
            throw new InvalidTicketStateException(
                    "Cannot assign ticket to " + assignee.getName()
                  + " — account is " + assignee.getStatus() + ".");
        }

        // Skip the noise if the ticket is already assigned to this user.
        boolean changed = ticket.getAssignedTo() == null
                || !ticket.getAssignedTo().getUserId().equals(assignee.getUserId());

        ticket.setAssignedTo(assignee);
        IncidentTicket saved = ticketRepository.save(ticket);

        if (changed) {
            createTicketTask(saved, assignee);
        }

        return mapper.toTicketResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SLARecordResponse getSlaRecord(Long ticketId) {
        SLARecord sla = slaRepository.findByTicket_TicketId(ticketId)
                .orElseThrow(() -> new IncidentNotFoundException("SLA not found for Ticket ID: " + ticketId));
        return mapper.toSLAResponse(sla);
    }
}
