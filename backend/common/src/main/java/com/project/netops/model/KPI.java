package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kpis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KPI {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kpi_id")
    private Long kpiId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "definition", columnDefinition = "TEXT")
    private String definition;

    @Column(name = "target_value")
    private Double targetValue;

    @Column(name = "current_value")
    private Double currentValue;

    @Column(name = "reporting_period")
    private String reportingPeriod;
}
