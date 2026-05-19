package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketAttachmentRequest {
    @NotBlank(message = "File URI is required") private String fileUri;
    private String checksum;
    private String description;
    @NotNull(message = "Uploaded By User ID is required") private Long uploadedById;
}
