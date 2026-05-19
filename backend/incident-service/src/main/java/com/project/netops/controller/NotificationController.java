package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.NotificationRequest;
import com.project.netops.dto.response.NotificationResponse;
import com.project.netops.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<APIResponse<NotificationResponse>> createNotification(
            @Valid @RequestBody NotificationRequest request) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "Notification created", notificationService.createNotification(request)),
                HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<APIResponse<List<NotificationResponse>>> getNotificationsByUser(
            @PathVariable Integer userId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched notifications",
                notificationService.getNotificationsByUser(userId)));
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<APIResponse<List<NotificationResponse>>> getUnreadByUser(
            @PathVariable Integer userId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched unread notifications",
                notificationService.getUnreadByUser(userId)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<APIResponse<NotificationResponse>> markAsRead(
            @PathVariable Long notificationId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Notification marked as read",
                notificationService.markAsRead(notificationId)));
    }
}
