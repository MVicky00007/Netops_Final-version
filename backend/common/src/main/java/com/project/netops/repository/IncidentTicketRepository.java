package com.project.netops.repository;

import com.project.netops.model.IncidentTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {
    /** All tickets ever opened against a given fault report (any status). */
    List<IncidentTicket> findByFault_FaultId(Long faultId);
}
