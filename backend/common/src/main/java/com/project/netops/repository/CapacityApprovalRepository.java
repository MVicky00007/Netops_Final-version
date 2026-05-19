package com.project.netops.repository;

import com.project.netops.model.CapacityApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CapacityApprovalRepository extends JpaRepository<CapacityApproval, Long> {
    Optional<CapacityApproval> findByPlanPlanId(Long planId);
}
