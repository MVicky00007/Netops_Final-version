package com.project.netops.service;

import java.util.List;

import com.project.netops.dto.request.AuditLogRequestDto;
import com.project.netops.dto.response.AuditLogResponseDto;

public interface AuditLogService {

    // Used by netops1 AuditLoggingAspect
    void log(AuditLogRequestDto requestDto);

    // Used by capacity module services (Long userId to stay compatible with capacity code)
    void logAction(Long userId, String action, String resourceType, Long resourceId, String details);

    List<AuditLogResponseDto> getAllLogs();

    List<AuditLogResponseDto> getLogsByUser(Integer userId);

    List<AuditLogResponseDto> getLogsByResourceType(String resourceType);

    List<AuditLogResponseDto> getLogsByAction(String action);
}
