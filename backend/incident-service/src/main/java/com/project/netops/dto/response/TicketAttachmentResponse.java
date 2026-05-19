package com.project.netops.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TicketAttachmentResponse {
    private Long attachmentId;
    private String fileUri;
    private String description;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
}
