package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "health_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "check_id")
    private Long checkId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TargetType targetType;

    @Column(name = "condition_text", nullable = false, columnDefinition = "TEXT")
    private String conditionText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "active", nullable = false)
    private Boolean active;

    public enum TargetType {
        SITE, NODE, INTERFACE
    }
}
