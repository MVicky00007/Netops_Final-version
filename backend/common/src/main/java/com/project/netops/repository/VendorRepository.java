package com.project.netops.repository;

import com.project.netops.model.VendorRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorRepository extends JpaRepository<VendorRecord, Long> {
}
