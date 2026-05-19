package com.project.netops.repository;

import com.project.netops.model.EdgeNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EdgeNodeRepository extends JpaRepository<EdgeNode, Long> {
    List<EdgeNode> findBySite_SiteId(Long siteId);
}
