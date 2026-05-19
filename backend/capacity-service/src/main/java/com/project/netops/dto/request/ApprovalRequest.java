package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalRequest {

    @NotNull(message = "approvedBy is required")
    private Long approvedBy;

    @NotBlank(message = "status is required")
    private String status;

    private String comments;
}
