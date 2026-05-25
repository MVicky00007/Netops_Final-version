package com.project.netops.service.impl;

import com.project.netops.aspect.Auditable;
import com.project.netops.dto.request.FaultReportRequest;
import com.project.netops.dto.response.FaultReportResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.FaultReportMapper;
import com.project.netops.model.EdgeNode;
import com.project.netops.model.FaultReport;
import com.project.netops.model.Interface;
import com.project.netops.model.Notification;
import com.project.netops.model.Site;
import com.project.netops.model.Task;
import com.project.netops.model.User;
import com.project.netops.repository.EdgeNodeRepository;
import com.project.netops.repository.FaultReportRepository;
import com.project.netops.repository.InterfaceRepository;
import com.project.netops.repository.NotificationRepository;
import com.project.netops.repository.SiteRepository;
import com.project.netops.repository.TaskRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.FaultReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Fault report workflow:
 *
 *   1. Field/network engineer creates a fault report (status = OPEN).
 *   2. The system records the node + interface so triagers know where to
 *      look (previously this was dropped on the floor).
 *   3. The system auto-creates a triage Task assigned to an active
 *      NETWORK_ENGINEER so it lands in their My tasks board, plus an
 *      in-app Notification with category=TICKET pointing to the fault.
 *   4. The network engineer opens the fault, escalates it to a ticket
 *      via the existing /api/v1/tickets endpoint, and assigns the ticket
 *      to a field engineer to do the physical work.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FaultReportServiceImpl implements FaultReportService {

    private final FaultReportRepository faultReportRepository;
    private final UserRepo userRepository;
    private final SiteRepository siteRepository;
    private final EdgeNodeRepository nodeRepository;
    private final InterfaceRepository interfaceRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final FaultReportMapper mapper;

    @Override
    @Transactional
    @Auditable(action = "CREATE_FAULT", resourceType = "FaultReport")
    public FaultReportResponse createFaultReport(FaultReportRequest request) {
        User reporter = userRepository.findById(request.getReportedById().intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site not found"));

        FaultReport.FaultReportBuilder b = FaultReport.builder()
                .reportedBy(reporter)
                .site(site)
                .severity(FaultReport.Severity.valueOf(request.getSeverity().toUpperCase()))
                .description(request.getDescription())
                .status(FaultReport.Status.OPEN);

        // Persist the precise location info if the reporter gave it.
        if (request.getNodeId() != null) {
            EdgeNode node = nodeRepository.findById(request.getNodeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Node not found"));
            b.node(node);
        }
        if (request.getInterfaceId() != null) {
            Interface iface = interfaceRepository.findById(request.getInterfaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Interface not found"));
            b.iface(iface);
        }

        FaultReport saved = faultReportRepository.save(b.build());

        // Auto-create a triage Task + Notification for an active NETWORK_ENGINEER
        // so the fault doesn't just sit in a list waiting to be noticed.
        notifyNetworkEngineer(saved);

        return mapper.toResponse(saved);
    }

    /**
     * Pick any active network engineer (round-robin would be nicer, but the
     * MVP just picks the first match) and create a Task + Notification on the
     * fault so it appears in their work queue immediately.
     */
    private void notifyNetworkEngineer(FaultReport fault) {
        User assignee = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.NETWORK_ENGINEER
                          && u.getStatus() == User.Status.ACTIVE)
                .findFirst()
                .orElse(null);

        if (assignee == null) {
            log.warn("No active NETWORK_ENGINEER available to triage fault #{}", fault.getFaultId());
            return;
        }

        String location = fault.getSite().getName()
                + (fault.getNode() != null ? " / " + fault.getNode().getHostname() : "")
                + (fault.getIface() != null ? " / " + fault.getIface().getName() : "");

        Task triage = Task.builder()
                .user(assignee)
                .relatedEntityId(fault.getFaultId())
                .description("Triage fault #" + fault.getFaultId() + " (" + fault.getSeverity()
                        + ") at " + location + ": " + fault.getDescription())
                .dueDate(LocalDate.now().plusDays(1))
                .status(Task.Status.PENDING)
                .build();
        taskRepository.save(triage);

        Notification notif = Notification.builder()
                .user(assignee)
                .entityId(fault.getFaultId())
                .message("New " + fault.getSeverity() + " fault reported at " + location
                        + " — please triage and escalate to a ticket if needed.")
                .category(Notification.Category.TICKET)
                .status(Notification.Status.UNREAD)
                .build();
        notificationRepository.save(notif);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FaultReportResponse> getAllFaultReports() {
        return faultReportRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FaultReportResponse updateFaultStatus(Long faultId, String newStatus) {
        FaultReport report = faultReportRepository.findById(faultId)
                .orElseThrow(() -> new ResourceNotFoundException("Fault Report not found"));
        report.setStatus(FaultReport.Status.valueOf(newStatus.toUpperCase()));
        return mapper.toResponse(faultReportRepository.save(report));
    }
}
