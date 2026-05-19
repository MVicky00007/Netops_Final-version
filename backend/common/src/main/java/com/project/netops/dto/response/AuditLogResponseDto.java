package com.project.netops.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponseDto {

    private Integer auditId;
    private Integer userId;
    private String userName;
    private String action;
    private String resourceType;
    private String resourceId;
    private String details;
    private LocalDateTime timestamp;
}
