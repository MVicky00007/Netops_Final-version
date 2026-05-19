package com.project.netops.repository;

import com.project.netops.model.CapacityPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CapacityPlanRepository extends JpaRepository<CapacityPlan, Long> {
    List<CapacityPlan> findBySiteSiteId(Long siteId);
    List<CapacityPlan> findByStatus(CapacityPlan.PlanStatus status);
    List<CapacityPlan> findByRequestedByUserId(Long userId);
}
