package com.project.netops.repository;

import com.project.netops.model.FaultReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FaultReportRepository extends JpaRepository<FaultReport, Long> {
}
