package com.project.netops.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterfaceRequestDTO {
    private String name;
    private String type;
    private Integer capacityMbps;
    private String adminStatus;
    private String operStatus;
}
