package com.project.netops.aspect;

import com.project.netops.model.AuditLog;
import com.project.netops.model.User;
import com.project.netops.repository.AuditLogRepo;
import com.project.netops.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
public class ActivityAuditAspect {

    private final AuditLogRepo auditLogRepository;
    private final UserRepo userRepository;
    private final AuditorAware<Long> auditorAware;

    // Using @AfterReturning so it only audits if the method succeeds without crashing
    // This looks for our custom @Auditable annotation
    @AfterReturning(value = "@annotation(auditable)")
    public void logActivity(JoinPoint jp, Auditable auditable) {

        // 1. Get the current user ID using the AuditorAware concept
        Long currentUserId = auditorAware.getCurrentAuditor().orElse(1L);
        User currentUser = userRepository.findById(currentUserId.intValue()).orElse(null);

        // 2. Extract the ID of the ticket/fault being updated from the method parameters
        Long resourceId = null;
        Object[] args = jp.getArgs();
        if (args != null && args.length > 0 && args[0] instanceof Long) {
            resourceId = (Long) args[0]; // Assumes the first parameter is the ID
        }

        // 3. Save the actual AuditLog to the database
        if (currentUser != null) {
            AuditLog auditLog = AuditLog.builder()
                    .user(currentUser)
                    .action(auditable.action())
                    .resourceType(auditable.resourceType())
                    .resourceId(resourceId != null ? resourceId.toString() : null)
                    .details("Executed backend method: " + jp.getSignature().getName())
                    .timestamp(LocalDateTime.now())
                    .build();

            auditLogRepository.save(auditLog);

            System.out.println("Log after: " + jp.getSignature() + " - Saved to Database successfully.");
        }
    }
}
