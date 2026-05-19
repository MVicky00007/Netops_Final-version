package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationRequest {
    @NotNull(message = "User ID is required") private Integer userId;
    private Long entityId;
    @NotBlank(message = "Message is required") private String message;
    @NotBlank(message = "Category is required") private String category;
}
