package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CapacityPlanRequest {

    @NotNull(message = "siteId is required")
    private Long siteId;

    @NotNull(message = "interfaceId is required")
    private Long interfaceId;

    @NotNull(message = "currentCapacity is required")
    @Positive(message = "currentCapacity must be positive")
    private Double currentCapacity;

    @NotNull(message = "proposedCapacity is required")
    @Positive(message = "proposedCapacity must be positive")
    private Double proposedCapacity;

    @NotBlank(message = "reason is required")
    private String reason;

    @NotNull(message = "requestedBy is required")
    private Long requestedBy;
}
