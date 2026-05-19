package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeNodeResponseDTO {
    private Long nodeId;
    private Long siteId;
    private String siteName;
    private String hostname;
    private String model;
    private String serialNumber;
    private LocalDate installedAt;
    private String status;
}
