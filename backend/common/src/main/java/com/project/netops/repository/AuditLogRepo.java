package com.project.netops.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.project.netops.model.AuditLog;
import java.util.List;

public interface AuditLogRepo extends JpaRepository<AuditLog, Integer> {
    List<AuditLog> findByUser_UserId(Integer userId);
    List<AuditLog> findByResourceType(String resourceType);
    List<AuditLog> findByAction(String action);
}
