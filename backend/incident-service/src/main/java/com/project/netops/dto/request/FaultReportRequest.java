package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FaultReportRequest {
    @NotNull(message = "Reporter ID is required") private Long reportedById;
    @NotNull(message = "Site ID is required") private Long siteId;
    private Long nodeId;
    private Long interfaceId;
    @NotBlank(message = "Severity is required") private String severity;
    @NotBlank(message = "Description cannot be empty") private String description;
}
