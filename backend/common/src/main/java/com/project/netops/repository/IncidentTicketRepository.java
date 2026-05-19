package com.project.netops.repository;

import com.project.netops.model.IncidentTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {
}
