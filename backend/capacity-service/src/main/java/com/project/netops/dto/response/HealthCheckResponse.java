package com.project.netops.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HealthCheckResponse {
    private Long checkId;
    private String name;
    private String description;
    private String targetType;
    private String conditionText;
    private Integer createdBy;
    private String createdByName;
    private Boolean active;
}
