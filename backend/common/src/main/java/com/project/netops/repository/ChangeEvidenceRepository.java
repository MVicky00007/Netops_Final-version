package com.project.netops.repository;

import com.project.netops.model.ChangeEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChangeEvidenceRepository extends JpaRepository<ChangeEvidence, Long> {
    List<ChangeEvidence> findByPlanPlanId(Long planId);
}
