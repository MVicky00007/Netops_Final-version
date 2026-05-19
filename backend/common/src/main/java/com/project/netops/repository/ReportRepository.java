package com.project.netops.repository;

import com.project.netops.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByType(Report.ReportType type);
    List<Report> findByGeneratedBy_UserId(Integer userId);
}
