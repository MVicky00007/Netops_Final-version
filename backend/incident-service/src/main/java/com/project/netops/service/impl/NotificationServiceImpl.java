package com.project.netops.service.impl;

import com.project.netops.dto.request.NotificationRequest;
import com.project.netops.dto.response.NotificationResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.NotificationMapper;
import com.project.netops.model.Notification;
import com.project.netops.model.User;
import com.project.netops.repository.NotificationRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepo userRepo;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        User user = userRepo.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Notification notification = Notification.builder()
                .user(user)
                .entityId(request.getEntityId())
                .message(request.getMessage())
                .category(Notification.Category.valueOf(request.getCategory().toUpperCase()))
                .status(Notification.Status.UNREAD)
                .build();

        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsByUser(Integer userId) {
        return notificationRepository.findByUser_UserId(userId).stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadByUser(Integer userId) {
        return notificationRepository.findByUser_UserIdAndStatus(userId, Notification.Status.UNREAD).stream()
                .map(notificationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        notification.setStatus(Notification.Status.READ);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }
}
