package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KPIRequest {
    @NotBlank(message = "Name is required") private String name;
    private String definition;
    private Double targetValue;
    private Double currentValue;
    private String reportingPeriod;
}
