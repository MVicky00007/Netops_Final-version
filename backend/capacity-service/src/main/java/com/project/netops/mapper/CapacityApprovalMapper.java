package com.project.netops.mapper;

import com.project.netops.dto.response.CapacityApprovalResponse;
import com.project.netops.model.CapacityApproval;
import org.springframework.stereotype.Component;

@Component
public class CapacityApprovalMapper {

    public CapacityApprovalResponse toResponse(CapacityApproval approval) {
        return CapacityApprovalResponse.builder()
                .approvalId(approval.getApprovalId())
                .planId(approval.getPlan().getPlanId())
                .approvedBy(approval.getApprovedBy().getUserId().longValue())
                .approvedAt(approval.getApprovedAt())
                .comments(approval.getComments())
                .status(approval.getStatus().name())
                .build();
    }
}
