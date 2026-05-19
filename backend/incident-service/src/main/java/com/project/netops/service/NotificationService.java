package com.project.netops.service;

import com.project.netops.dto.request.NotificationRequest;
import com.project.netops.dto.response.NotificationResponse;
import java.util.List;

public interface NotificationService {
    NotificationResponse createNotification(NotificationRequest request);
    List<NotificationResponse> getNotificationsByUser(Integer userId);
    List<NotificationResponse> getUnreadByUser(Integer userId);
    NotificationResponse markAsRead(Long notificationId);
}
