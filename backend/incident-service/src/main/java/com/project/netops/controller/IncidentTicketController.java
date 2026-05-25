package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.IncidentTicketRequest;
import com.project.netops.dto.request.TicketAttachmentRequest;
import com.project.netops.dto.response.IncidentTicketResponse;
import com.project.netops.dto.response.SLARecordResponse;
import com.project.netops.dto.response.TicketAttachmentResponse;
import com.project.netops.model.TicketAttachment;
import com.project.netops.service.IncidentTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLConnection;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class IncidentTicketController {

    private final IncidentTicketService service;

    @PostMapping
    public ResponseEntity<APIResponse<IncidentTicketResponse>> createTicket(
            @Valid @RequestBody IncidentTicketRequest request) {
        return new ResponseEntity<>(new APIResponse<>("SUCCESS", "Ticket created", service.createTicket(request)),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<APIResponse<List<IncidentTicketResponse>>> getAllTickets() {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched tickets", service.getAllTickets()));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<APIResponse<IncidentTicketResponse>> getTicketById(@PathVariable Long ticketId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched ticket", service.getTicketById(ticketId)));
    }

    @PatchMapping("/{ticketId}")
    public ResponseEntity<APIResponse<IncidentTicketResponse>> updateTicketStatus(@PathVariable Long ticketId,
            @RequestParam String status, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(
                new APIResponse<>("SUCCESS", "Updated ticket", service.updateTicketStatus(ticketId, status, notes)));
    }

    @PatchMapping("/{ticketId}/assign")
    public ResponseEntity<APIResponse<IncidentTicketResponse>> assignTicket(@PathVariable Long ticketId,
            @RequestParam Long assignedToId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Ticket reassigned",
                service.assignTicket(ticketId, assignedToId)));
    }

    @PostMapping("/{ticketId}/attachments")
    public ResponseEntity<APIResponse<TicketAttachmentResponse>> uploadAttachment(@PathVariable Long ticketId,
            @Valid @RequestBody TicketAttachmentRequest request) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "Attachment uploaded", service.uploadAttachment(ticketId, request)),
                HttpStatus.CREATED);
    }

    /** Field-engineer-friendly multipart upload — accepts the actual file
     *  (photo, log dump, etc.) instead of a pre-existing URI. */
    @PostMapping(value = "/{ticketId}/attachments/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<APIResponse<TicketAttachmentResponse>> uploadAttachmentFile(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("uploadedById") Long uploadedById,
            @RequestParam(value = "description", required = false) String description) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "Attachment uploaded",
                        service.uploadAttachmentFile(ticketId, uploadedById, description, file)),
                HttpStatus.CREATED);
    }

    /** Stream a previously uploaded attachment back to the browser. */
    @GetMapping("/{ticketId}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long ticketId,
                                                       @PathVariable Long attachmentId) {
        TicketAttachment meta = service.getAttachment(attachmentId);
        Resource body = service.downloadAttachment(attachmentId);
        String filename = body.getFilename() == null ? "attachment-" + attachmentId : body.getFilename();
        String contentType = URLConnection.guessContentTypeFromName(filename);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                .body(body);
    }

    @GetMapping("/{ticketId}/attachments")
    public ResponseEntity<APIResponse<List<TicketAttachmentResponse>>> listAttachments(
            @PathVariable Long ticketId) {
        return ResponseEntity.ok(
                new APIResponse<>("SUCCESS", "Fetched attachments", service.listAttachments(ticketId)));
    }

    @GetMapping("/{ticketId}/sla")
    public ResponseEntity<APIResponse<SLARecordResponse>> getSlaRecord(@PathVariable Long ticketId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched SLA", service.getSlaRecord(ticketId)));
    }
}
