package com.project.netops.dto.request;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeNodeRequestDTO {
    private String hostname;
    private String model;
    private String serialNumber;
    private LocalDate installedAt;
    private String status;
}
