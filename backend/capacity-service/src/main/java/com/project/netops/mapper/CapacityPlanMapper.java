package com.project.netops.mapper;

import com.project.netops.dto.response.CapacityPlanResponse;
import com.project.netops.model.CapacityPlan;
import org.springframework.stereotype.Component;

@Component
public class CapacityPlanMapper {

    /**
     * Build the API response from a CapacityPlan. We resolve the linked Site /
     * Interface / Requester display names here so the frontend table doesn't
     * have to make extra round trips per row.
     */
    public CapacityPlanResponse toResponse(CapacityPlan plan) {
        var b = CapacityPlanResponse.builder()
                .planId(plan.getPlanId())
                .currentCapacity(plan.getCurrentCapacity())
                .proposedCapacity(plan.getProposedCapacity())
                .reason(plan.getReason())
                .requestedAt(plan.getRequestedAt())
                .status(plan.getStatus().name());

        if (plan.getSite() != null) {
            b.siteId(plan.getSite().getSiteId())
             .siteCode(plan.getSite().getSiteCode())
             .siteName(plan.getSite().getName());
        }
        if (plan.getIface() != null) {
            b.interfaceId(plan.getIface().getInterfaceId())
             .interfaceName(plan.getIface().getName());
        }
        if (plan.getRequestedBy() != null) {
            b.requestedBy(plan.getRequestedBy().getUserId().longValue())
             .requestedByName(plan.getRequestedBy().getName());
        }

        return b.build();
    }
}
