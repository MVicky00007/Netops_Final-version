package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_check_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "run_id")
    private Long runId;

    @ManyToOne
    @JoinColumn(name = "check_id", nullable = false)
    private HealthCheck healthCheck;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @ManyToOne
    @JoinColumn(name = "run_by", nullable = false)
    private User runBy;

    @Column(name = "run_at", nullable = false, updatable = false)
    private LocalDateTime runAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false)
    private Result result;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @PrePersist
    protected void onCreate() {
        this.runAt = LocalDateTime.now();
    }

    public enum Result {
        PASS, FAIL
    }
}
