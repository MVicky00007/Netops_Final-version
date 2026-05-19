package com.project.netops.repository;

import com.project.netops.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
}
