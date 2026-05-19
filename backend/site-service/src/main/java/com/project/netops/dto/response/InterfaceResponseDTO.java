package com.project.netops.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterfaceResponseDTO {
    private Long interfaceId;
    private Long nodeId;
    private String nodeName;
    private String name;
    private String type;
    private Integer capacityMbps;
    private String adminStatus;
    private String operStatus;
}
