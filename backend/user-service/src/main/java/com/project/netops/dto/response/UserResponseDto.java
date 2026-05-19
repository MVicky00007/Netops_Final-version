package com.project.netops.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {

    private Integer userId;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String status;
}
