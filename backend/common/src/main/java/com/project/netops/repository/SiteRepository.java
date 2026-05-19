package com.project.netops.repository;

import com.project.netops.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    Optional<Site> findBySiteCode(String siteCode);
    List<Site> findByRegion(String region);
    List<Site> findByStatus(Site.Status status);
}
