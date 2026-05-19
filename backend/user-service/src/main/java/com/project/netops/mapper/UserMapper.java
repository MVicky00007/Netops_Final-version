package com.project.netops.mapper;

import com.project.netops.dto.request.UserRequestDto;
import com.project.netops.dto.response.UserResponseDto;
import com.project.netops.model.User;

public class UserMapper {

    // Entity to ResponseDto mapping
    public static UserResponseDto mapToDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole().name());
        dto.setStatus(user.getStatus().name());
        return dto;
    }

    // RequestDto to Entity mapping
    public static User mapToEntity(UserRequestDto dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        return user;
    }
}
