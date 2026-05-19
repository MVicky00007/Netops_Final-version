package com.project.netops.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KPIResponse {
    private Long kpiId;
    private String name;
    private String definition;
    private Double targetValue;
    private Double currentValue;
    private String reportingPeriod;
}
