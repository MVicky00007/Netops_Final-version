package com.project.netops.repository;

import com.project.netops.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    /** All attachments belonging to a given incident ticket, newest first. */
    List<TicketAttachment> findByTicket_TicketIdOrderByUploadedAtDesc(Long ticketId);
}
