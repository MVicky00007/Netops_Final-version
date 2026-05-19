package com.project.netops.repository;

import com.project.netops.model.HealthCheckRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HealthCheckRunRepository extends JpaRepository<HealthCheckRun, Long> {
    List<HealthCheckRun> findByHealthCheck_CheckId(Long checkId);
    List<HealthCheckRun> findByRunBy_UserId(Integer userId);
    List<HealthCheckRun> findByResult(HealthCheckRun.Result result);
}
