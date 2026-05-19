package com.project.netops.mapper;

import com.project.netops.dto.response.AuditLogResponseDto;
import com.project.netops.model.AuditLog;

public class AuditLogMapper {

    public static AuditLogResponseDto mapToDto(AuditLog log) {
        AuditLogResponseDto dto = new AuditLogResponseDto();
        dto.setAuditId(log.getAuditId());
        dto.setUserId(log.getUser().getUserId());
        dto.setUserName(log.getUser().getName());
        dto.setAction(log.getAction());
        dto.setResourceType(log.getResourceType());
        dto.setResourceId(log.getResourceId());
        dto.setDetails(log.getDetails());
        dto.setTimestamp(log.getTimestamp());
        return dto;
    }
}
