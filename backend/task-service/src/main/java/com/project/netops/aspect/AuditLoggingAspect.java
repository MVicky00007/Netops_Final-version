package com.project.netops.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.project.netops.dto.request.AuditLogRequestDto;
import com.project.netops.model.User;
import com.project.netops.repository.UserRepo;
import com.project.netops.security.JwtUtil;
import com.project.netops.service.AuditLogService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Aspect
@Component
public class AuditLoggingAspect {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JwtUtil jwtUtil;

    // Watches all methods in serviceimple package
    // Excludes AuditLogServiceImple to prevent infinite loop
    @AfterReturning("execution(* com.project.netops.service.serviceimple.*.*(..)) " +
                    "&& !execution(* com.project.netops.service.serviceimple.AuditLogServiceImple.*(..))")
    public void logAfterMethod(JoinPoint joinPoint) {
        try {
            // Step 1: get the HTTP request
            HttpServletRequest request = ((ServletRequestAttributes)
                    RequestContextHolder.getRequestAttributes()).getRequest();

            // Step 2: extract JWT token from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) return;

            // Step 3: extract email from JWT using jwtUtil.extractEmail()
            String token = authHeader.substring(7); // removes "Bearer " prefix
            String email = jwtUtil.extractEmail(token);
            if (email == null) return;

            // Step 4: fetch user from DB using email
            User user = userRepo.findByEmail(email);
            if (user == null) return;

            // Step 5: build the AuditLogRequestDto
            AuditLogRequestDto requestDto = new AuditLogRequestDto();
            requestDto.setUserId(user.getUserId());
            requestDto.setAction(joinPoint.getSignature().getName());        // e.g. signUp, blockUser
            requestDto.setResourceType(joinPoint.getTarget().getClass()
                                       .getSimpleName()                      // e.g. UserServiceImple
                                       .replace("ServiceImple", "")          // simplify to e.g. User
                                       .toUpperCase());                      // e.g. USER
            requestDto.setResourceId(getResourceId(joinPoint.getArgs()));    // first Integer arg if exists
            requestDto.setDetails("Method executed: " + joinPoint.getSignature().getName());

            // Step 6: save the log
            auditLogService.log(requestDto);
            log.info("Audit log saved - User: {}, Action: {}, Resource: {}",
                    email, requestDto.getAction(), requestDto.getResourceType());

        }
        catch (Exception e) {
            // never let audit logging crash the main flow
            log.error("Audit log failed for method '{}': {}",
                    joinPoint.getSignature().getName(), e.getMessage());
        }
    }

    // ─── Helper: extracts the first Integer argument as resourceId ───────────
    private String getResourceId(Object[] args) {
        if (args == null || args.length == 0) return null;
        for (Object arg : args) {
            if (arg instanceof Integer) {
                return arg.toString();
            }
        }
        return null;
    }
}
