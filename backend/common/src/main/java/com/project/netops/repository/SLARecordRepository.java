package com.project.netops.repository;

import com.project.netops.model.SLARecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SLARecordRepository extends JpaRepository<SLARecord, Long> {
    Optional<SLARecord> findByTicket_TicketId(Long ticketId);
}
