package com.project.netops.mapper;

import com.project.netops.dto.response.NotificationResponse;
import com.project.netops.model.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification n) {
        if (n == null) return null;
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUser().getUserId())
                .entityId(n.getEntityId())
                .message(n.getMessage())
                .category(n.getCategory().name())
                .status(n.getStatus().name())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
