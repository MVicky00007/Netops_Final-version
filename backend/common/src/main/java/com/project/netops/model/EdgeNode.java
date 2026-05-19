package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "edge_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "node_id")
    private Long nodeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Column(name = "hostname", nullable = false)
    private String hostname;

    @Column(name = "model")
    private String model;

    @Column(name = "serial_number", unique = true)
    private String serialNumber;

    @Column(name = "installed_at")
    private LocalDate installedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @OneToMany(mappedBy = "node", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Interface> interfaces;

    public enum Status {
        ONLINE, OFFLINE, DEGRADED, MAINTENANCE
    }
}
