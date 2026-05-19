package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sla_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SLARecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sla_id")
    private Long slaId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private IncidentTicket ticket;

    @Column(name = "response_due_at", nullable = false)
    private LocalDateTime responseDueAt;

    @Column(name = "resolution_due_at", nullable = false)
    private LocalDateTime resolutionDueAt;

    @Builder.Default
    @Column(name = "breach_flag", nullable = false)
    private Boolean breachFlag = false;
}
