package com.project.netops.repository;

import com.project.netops.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_UserId(Integer userId);
    List<Notification> findByUser_UserIdAndStatus(Integer userId, Notification.Status status);
    List<Notification> findByUser_UserIdAndCategory(Integer userId, Notification.Category category);
}
