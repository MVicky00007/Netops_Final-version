package com.project.netops.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="user_id")
    private Integer userId;
    private String name;
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String email;
    private String phone;

    @Enumerated(EnumType.STRING)
    private Status status;


    public enum Role{
        ADMIN,
        MANAGER,
        NETWORK_ENGINEER,
        FIELD_ENGINEER,
        AUDITOR
    }

    public enum Status{
        ACTIVE,
        INACTIVE,
        SUSPENDED
    }

}
