package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "capacity_approvals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CapacityApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approval_id")
    private Long approvalId;

    @OneToOne
    @JoinColumn(name = "plan_id", nullable = false, unique = true)
    private CapacityPlan plan;

    @ManyToOne
    @JoinColumn(name = "approved_by", nullable = false)
    private User approvedBy;

    @Column(name = "approved_at", nullable = false, updatable = false)
    private LocalDateTime approvedAt;

    @Column(name = "comments", length = 1000)
    private String comments;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApprovalStatus status;

    @PrePersist
    protected void onCreate() {
        this.approvedAt = LocalDateTime.now();
    }

    public enum ApprovalStatus {
        APPROVED, REJECTED
    }
}
