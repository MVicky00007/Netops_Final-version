package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IncidentTicketRequest {
    @NotNull(message = "Fault ID is required") private Long faultId;
    @NotNull(message = "Created By User ID is required") private Long createdById;
    private Long assignedToId;
    @NotBlank(message = "Priority is required") private String priority;
}
