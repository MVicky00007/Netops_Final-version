package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.ApprovalRequest;
import com.project.netops.dto.request.CapacityPlanRequest;
import com.project.netops.dto.response.CapacityApprovalResponse;
import com.project.netops.dto.response.CapacityPlanResponse;
import com.project.netops.exception.BadRequestException;
import com.project.netops.model.CapacityApproval;
import com.project.netops.service.CapacityPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/capacity-plans")
@RequiredArgsConstructor
public class CapacityPlanController {

    private final CapacityPlanService planService;

    @PostMapping
    public ResponseEntity<APIResponse<CapacityPlanResponse>> submitPlan(
            @Valid @RequestBody CapacityPlanRequest req) {

        CapacityPlanResponse saved = planService.submitPlan(
                req.getSiteId(), req.getInterfaceId(),
                req.getCurrentCapacity(), req.getProposedCapacity(),
                req.getReason(), req.getRequestedBy());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(APIResponse.success("Capacity plan submitted.", saved));
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<CapacityPlanResponse>>> listPlans(
            @RequestParam(required = false) String status) {

        List<CapacityPlanResponse> plans = planService.listPlans(status);
        return ResponseEntity.ok(APIResponse.success(plans));
    }

    @PostMapping("/{planId}/approve")
    public ResponseEntity<APIResponse<CapacityApprovalResponse>> approvePlan(
            @PathVariable Long planId,
            @Valid @RequestBody ApprovalRequest req) {

        CapacityApproval.ApprovalStatus decision;
        try {
            decision = CapacityApproval.ApprovalStatus.valueOf(req.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status. Must be APPROVED or REJECTED.");
        }

        CapacityApprovalResponse approval = planService.approvePlan(
                planId, req.getApprovedBy(), decision, req.getComments());

        return ResponseEntity.ok(APIResponse.success("Plan " + decision.name().toLowerCase() + ".", approval));
    }
}
