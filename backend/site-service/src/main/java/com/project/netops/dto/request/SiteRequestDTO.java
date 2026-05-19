package com.project.netops.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteRequestDTO {
    private String siteCode;
    private String name;
    private String region;
    private String address;
    private Double latitude;
    private Double longitude;
    private String status;
}
