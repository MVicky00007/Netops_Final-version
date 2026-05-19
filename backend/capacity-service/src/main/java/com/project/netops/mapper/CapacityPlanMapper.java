package com.project.netops.mapper;

import com.project.netops.dto.response.CapacityPlanResponse;
import com.project.netops.model.CapacityPlan;
import org.springframework.stereotype.Component;

@Component
public class CapacityPlanMapper {

    public CapacityPlanResponse toResponse(CapacityPlan plan) {
        return CapacityPlanResponse.builder()
                .planId(plan.getPlanId())
                .siteId(plan.getSite().getSiteId())
                .interfaceId(plan.getIface().getInterfaceId())
                .currentCapacity(plan.getCurrentCapacity())
                .proposedCapacity(plan.getProposedCapacity())
                .reason(plan.getReason())
                .requestedBy(plan.getRequestedBy().getUserId().longValue())
                .requestedAt(plan.getRequestedAt())
                .status(plan.getStatus().name())
                .build();
    }
}
