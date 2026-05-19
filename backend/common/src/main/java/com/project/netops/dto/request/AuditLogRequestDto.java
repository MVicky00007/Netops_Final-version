package com.project.netops.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequestDto {

    @NotNull(message = "User ID is required")
    private Integer userId;

    // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    @NotEmpty(message = "Action is required")
    private String action;

    // USER, DEVICE, TICKET
    @NotEmpty(message = "Resource type is required")
    private String resourceType;

    // ID of the affected resource
    private String resourceId;

    // extra context / description
    private String details;
}
