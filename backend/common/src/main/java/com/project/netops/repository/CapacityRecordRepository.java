package com.project.netops.repository;

import com.project.netops.model.CapacityRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CapacityRecordRepository extends JpaRepository<CapacityRecord, Long> {
    List<CapacityRecord> findBySiteSiteId(Long siteId);
    List<CapacityRecord> findByIfaceInterfaceId(Long interfaceId);
    List<CapacityRecord> findBySiteSiteIdAndIfaceInterfaceId(Long siteId, Long interfaceId);
}
