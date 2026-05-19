package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {
    private Long notificationId;
    private Integer userId;
    private Long entityId;
    private String message;
    private String category;
    private String status;
    private LocalDateTime createdAt;
}
