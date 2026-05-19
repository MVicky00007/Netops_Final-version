package com.project.netops.service;

import com.project.netops.dto.response.CapacityApprovalResponse;
import com.project.netops.dto.response.CapacityPlanResponse;
import com.project.netops.model.CapacityApproval;
import java.util.List;

public interface CapacityPlanService {
    CapacityPlanResponse submitPlan(Long siteId, Long interfaceId, Double currentCapacity,
            Double proposedCapacity, String reason, Long requestedById);
    List<CapacityPlanResponse> listPlans(String status);
    CapacityApprovalResponse approvePlan(Long planId, Long approvedById,
            CapacityApproval.ApprovalStatus decision, String comments);
}
