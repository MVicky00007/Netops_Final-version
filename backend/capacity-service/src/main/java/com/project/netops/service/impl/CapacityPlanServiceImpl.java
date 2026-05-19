package com.project.netops.service.impl;

import com.project.netops.dto.response.CapacityApprovalResponse;
import com.project.netops.dto.response.CapacityPlanResponse;
import com.project.netops.exception.BadRequestException;
import com.project.netops.exception.ConflictException;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.CapacityApprovalMapper;
import com.project.netops.mapper.CapacityPlanMapper;
import com.project.netops.model.*;
import com.project.netops.repository.*;
import com.project.netops.service.AuditLogService;
import com.project.netops.service.CapacityPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CapacityPlanServiceImpl implements CapacityPlanService {

    private final CapacityPlanRepository planRepository;
    private final CapacityApprovalRepository approvalRepository;
    private final SiteRepository siteRepository;
    private final InterfaceRepository interfaceRepository;
    private final UserRepo userRepository;
    private final AuditLogService auditLogService;
    private final CapacityPlanMapper planMapper;
    private final CapacityApprovalMapper approvalMapper;

    @Override
    @Transactional
    public CapacityPlanResponse submitPlan(Long siteId, Long interfaceId, Double currentCapacity,
            Double proposedCapacity, String reason, Long requestedById) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found."));
        Interface iface = interfaceRepository.findById(interfaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Interface not found."));
        User requestedBy = userRepository.findById(requestedById.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        CapacityPlan plan = CapacityPlan.builder()
                .site(site).iface(iface)
                .currentCapacity(currentCapacity)
                .proposedCapacity(proposedCapacity)
                .reason(reason).requestedBy(requestedBy)
                .status(CapacityPlan.PlanStatus.PENDING)
                .build();

        CapacityPlan saved = planRepository.save(plan);

        auditLogService.logAction(requestedById, "SUBMIT_CAPACITY_PLAN",
                "CapacityPlan", saved.getPlanId(),
                "Proposed: " + proposedCapacity + " Mbps. Reason: " + reason);

        return planMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CapacityPlanResponse> listPlans(String status) {
        List<CapacityPlan> plans;
        if (status != null && !status.isBlank()) {
            try {
                CapacityPlan.PlanStatus planStatus = CapacityPlan.PlanStatus.valueOf(status.toUpperCase());
                plans = planRepository.findByStatus(planStatus);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status. Must be DRAFT, PENDING, APPROVED, REJECTED, or IMPLEMENTED.");
            }
        } else {
            plans = planRepository.findAll();
        }
        return plans.stream().map(planMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CapacityApprovalResponse approvePlan(Long planId, Long approvedById,
            CapacityApproval.ApprovalStatus decision, String comments) {
        CapacityPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found."));

        if (plan.getStatus() != CapacityPlan.PlanStatus.PENDING) {
            throw new ConflictException("Only PENDING plans can be approved or rejected.");
        }

        User approvedBy = userRepository.findById(approvedById.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        CapacityApproval approval = CapacityApproval.builder()
                .plan(plan).approvedBy(approvedBy)
                .comments(comments).status(decision)
                .build();

        CapacityApproval saved = approvalRepository.save(approval);

        plan.setStatus(decision == CapacityApproval.ApprovalStatus.APPROVED
                ? CapacityPlan.PlanStatus.APPROVED
                : CapacityPlan.PlanStatus.REJECTED);
        planRepository.save(plan);

        auditLogService.logAction(approvedById, decision + "_CAPACITY_PLAN",
                "CapacityPlan", planId, comments);

        return approvalMapper.toResponse(saved);
    }
}
