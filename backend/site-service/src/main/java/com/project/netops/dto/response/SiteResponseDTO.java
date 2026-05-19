package com.project.netops.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteResponseDTO {
    private Long siteId;
    private String siteCode;
    private String name;
    private String region;
    private String address;
    private Double latitude;
    private Double longitude;
    private String status;
}
