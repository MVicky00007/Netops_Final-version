package com.project.netops.service;

import java.util.List;

import com.project.netops.dto.request.UserRequestDto;
import com.project.netops.dto.response.UserResponseDto;

public interface UserService {

    // Register
    String signUp(UserRequestDto userRequestDto);

    // Login
    UserResponseDto signIn(String email, String password);

    // Forgot Password
    String changePassword(String email, String newPassword);

    // Update Profile
    String updateProfile(String email, UserRequestDto updatedUser);

    // ADMIN functionalities
    List<UserResponseDto> getAllUsers();

    String updateRole(Integer userId, String role);

    String blockUser(Integer userId);

    String unblockUser(Integer userId);

    String deleteUser(Integer userId);

    String approveUser(Integer userId);

    List<UserResponseDto> getPendingUsers();
}
