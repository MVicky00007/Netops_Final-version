package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interfaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interface {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interface_id")
    private Long interfaceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private EdgeNode node;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private Type type;

    @Column(name = "capacity_mbps")
    private Integer capacityMbps;

    @Enumerated(EnumType.STRING)
    @Column(name = "admin_status", nullable = false)
    private AdminStatus adminStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "oper_status", nullable = false)
    private OperStatus operStatus;

    public enum Type {
        FIBER, COPPER, WIRELESS
    }

    public enum AdminStatus {
        UP, DOWN
    }

    public enum OperStatus {
        UP, DOWN, TESTING, UNKNOWN
    }
}
