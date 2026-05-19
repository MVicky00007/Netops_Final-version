package com.project.netops.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorResponseDTO {
    private Long vendorId;
    private String name;
    private String contactInfo;
    private String contractRef;
    private String status;
}
