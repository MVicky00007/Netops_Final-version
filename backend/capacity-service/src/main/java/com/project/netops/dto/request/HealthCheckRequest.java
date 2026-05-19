package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HealthCheckRequest {
    @NotBlank(message = "Name is required") private String name;
    private String description;
    @NotBlank(message = "Target type is required") private String targetType;
    @NotBlank(message = "Condition text is required") private String conditionText;
    @NotNull(message = "Created by is required") private Integer createdBy;
    @NotNull(message = "Active flag is required") private Boolean active;
}
