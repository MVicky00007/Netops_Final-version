package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CapacityApprovalResponse {
    private Long approvalId;
    private Long planId;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private String comments;
    private String status;
}
