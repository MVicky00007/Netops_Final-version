package com.project.netops.mapper;

import com.project.netops.dto.request.UserRequestDto;
import com.project.netops.dto.response.UserResponseDto;
import com.project.netops.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class UserMapperTest {

    @Test
    @DisplayName("mapToDto copies every field from entity to DTO")
    void mapToDto_copiesAllFields() {
        User user = new User();
        user.setUserId(7);
        user.setName("Carol");
        user.setEmail("carol@example.com");
        user.setPhone("555-7777");
        user.setRole(User.Role.MANAGER);
        user.setStatus(User.Status.ACTIVE);

        UserResponseDto dto = UserMapper.mapToDto(user);

        assertEquals(7, dto.getUserId());
        assertEquals("Carol", dto.getName());
        assertEquals("carol@example.com", dto.getEmail());
        assertEquals("555-7777", dto.getPhone());
        assertEquals("MANAGER", dto.getRole());
        assertEquals("ACTIVE", dto.getStatus());
    }

    @Test
    @DisplayName("mapToEntity copies name, email and phone but leaves auth-related fields unset")
    void mapToEntity_copiesBasicFieldsOnly() {
        UserRequestDto dto = new UserRequestDto();
        dto.setName("Dave");
        dto.setEmail("dave@example.com");
        dto.setPhone("555-1234");
        dto.setPassword("ignored-by-mapper");
        dto.setRole("ADMIN");

        User entity = UserMapper.mapToEntity(dto);

        assertEquals("Dave", entity.getName());
        assertEquals("dave@example.com", entity.getEmail());
        assertEquals("555-1234", entity.getPhone());
        // The mapper intentionally does not copy password/role/status —
        // those are handled by the service layer.
        assertNull(entity.getPassword());
        assertNull(entity.getRole());
        assertNull(entity.getStatus());
    }
}
