package com.project.netops.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.netops.dto.request.AuditLogRequestDto;
import com.project.netops.dto.response.AuditLogResponseDto;
import com.project.netops.exception.UserNotFoundException;
import com.project.netops.mapper.AuditLogMapper;
import com.project.netops.model.AuditLog;
import com.project.netops.model.User;
import com.project.netops.repository.AuditLogRepo;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.AuditLogService;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    @Autowired
    private AuditLogRepo auditLogRepo;

    @Autowired
    private UserRepo userRepo;

    @Override
    public void log(AuditLogRequestDto requestDto) {
        User user = userRepo.findById(requestDto.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + requestDto.getUserId()));

        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setAction(requestDto.getAction());
        log.setResourceType(requestDto.getResourceType());
        log.setResourceId(requestDto.getResourceId());
        log.setDetails(requestDto.getDetails());
        log.setTimestamp(LocalDateTime.now());
        auditLogRepo.save(log);
    }

    // Used by capacity module services — accepts Long userId, converts to Integer for UserRepo
    @Override
    public void logAction(Long userId, String action, String resourceType, Long resourceId, String details) {
        User user = userRepo.findById(userId.intValue())
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId != null ? resourceId.toString() : null);
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());
        auditLogRepo.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponseDto> getAllLogs() {
        return auditLogRepo.findAll().stream().map(AuditLogMapper::mapToDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponseDto> getLogsByUser(Integer userId) {
        return auditLogRepo.findByUser_UserId(userId).stream().map(AuditLogMapper::mapToDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponseDto> getLogsByResourceType(String resourceType) {
        return auditLogRepo.findByResourceType(resourceType).stream().map(AuditLogMapper::mapToDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponseDto> getLogsByAction(String action) {
        return auditLogRepo.findByAction(action).stream().map(AuditLogMapper::mapToDto).toList();
    }
}
