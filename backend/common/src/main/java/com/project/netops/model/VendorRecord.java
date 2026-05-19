package com.project.netops.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vendor_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "contact_info", columnDefinition = "TEXT")
    private String contactInfo;

    @Column(name = "contract_ref")
    private String contractRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    public enum Status {
        ACTIVE, INACTIVE, EXPIRED
    }
}
