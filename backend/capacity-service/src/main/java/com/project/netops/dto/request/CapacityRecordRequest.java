package com.project.netops.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CapacityRecordRequest {

    @NotNull(message = "siteId is required")
    private Long siteId;

    @NotNull(message = "interfaceId is required")
    private Long interfaceId;

    @NotNull(message = "measuredCapacityMbps is required")
    @Positive(message = "measuredCapacityMbps must be positive")
    private Double measuredCapacityMbps;

    @NotNull(message = "recordedBy is required")
    private Long recordedBy;
}
