package com.project.netops.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HealthCheckRunRequest {
    @NotNull(message = "Check ID is required") private Long checkId;
    @NotNull(message = "Target ID is required") private Long targetId;
    @NotNull(message = "Run by user ID is required") private Integer runBy;
}
