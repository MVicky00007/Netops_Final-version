package com.project.netops.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.netops.dto.response.AuditLogResponseDto;
import com.project.netops.service.AuditLogService;

@RestController
@RequestMapping("/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponseDto>> getAllLogs() {
        return new ResponseEntity<>(auditLogService.getAllLogs(), HttpStatus.OK);
    }

    @GetMapping("/by-user")
    public ResponseEntity<List<AuditLogResponseDto>> getLogsByUser(@RequestParam Integer userId) {
        return new ResponseEntity<>(auditLogService.getLogsByUser(userId), HttpStatus.OK);
    }

    @GetMapping("/by-resource")
    public ResponseEntity<List<AuditLogResponseDto>> getLogsByResourceType(@RequestParam String resourceType) {
        return new ResponseEntity<>(auditLogService.getLogsByResourceType(resourceType), HttpStatus.OK);
    }

    @GetMapping("/by-action")
    public ResponseEntity<List<AuditLogResponseDto>> getLogsByAction(@RequestParam String action) {
        return new ResponseEntity<>(auditLogService.getLogsByAction(action), HttpStatus.OK);
    }
}
