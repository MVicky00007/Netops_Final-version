package com.project.netops.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Before("execution(* com.project.netops.service.impl.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        log.info(">>> Entering: {}.{}()",
                joinPoint.getSignature().getDeclaringType().getSimpleName(),
                joinPoint.getSignature().getName());
    }

    @After("execution(* com.project.netops.service.impl.*.*(..))")
    public void logAfter(JoinPoint joinPoint) {
        log.info("<<< Exiting: {}.{}()",
                joinPoint.getSignature().getDeclaringType().getSimpleName(),
                joinPoint.getSignature().getName());
    }

    @Around("execution(* com.project.netops.service.impl.*.*(..))")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - start;
        log.info("--- {}.{}() executed in {} ms",
                joinPoint.getSignature().getDeclaringType().getSimpleName(),
                joinPoint.getSignature().getName(),
                duration);
        return result;
    }

    @AfterThrowing(
            pointcut = "execution(* com.project.netops.service.impl.*.*(..))",
            throwing = "error")
    public void logError(JoinPoint joinPoint, Throwable error) {
        log.error("!!! Exception in {}.{}() - {}",
                joinPoint.getSignature().getDeclaringType().getSimpleName(),
                joinPoint.getSignature().getName(),
                error.getMessage());
    }
}
