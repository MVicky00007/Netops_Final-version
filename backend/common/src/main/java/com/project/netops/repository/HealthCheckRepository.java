package com.project.netops.repository;

import com.project.netops.model.HealthCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HealthCheckRepository extends JpaRepository<HealthCheck, Long> {
    List<HealthCheck> findByActive(Boolean active);
    List<HealthCheck> findByTargetType(HealthCheck.TargetType targetType);
}
