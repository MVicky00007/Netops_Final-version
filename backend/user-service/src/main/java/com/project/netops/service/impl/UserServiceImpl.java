package com.project.netops.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.project.netops.dto.request.UserRequestDto;
import com.project.netops.dto.response.UserResponseDto;
import com.project.netops.model.User;
import com.project.netops.model.User.Role;
import com.project.netops.model.User.Status;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.UserService;
import com.project.netops.mapper.UserMapper;
import com.project.netops.exception.InvalidCredentialsException;
import com.project.netops.exception.RoleNotFoundException;
import com.project.netops.exception.AccountNotActiveException;
import com.project.netops.exception.AccountSuspendedException;
import com.project.netops.exception.UserAlreadyExistsException;
import com.project.netops.exception.UserNotFoundException;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder encoder;

    // ✅ Register
    @Override
    public String signUp(UserRequestDto userRequestDto) {

        if (userRepo.findByEmail(userRequestDto.getEmail().trim()) != null) {
            throw new UserAlreadyExistsException("Email already registered: " + userRequestDto.getEmail());
        }

        User user = UserMapper.mapToEntity(userRequestDto);
        user.setEmail(userRequestDto.getEmail().trim());
        user.setPassword(encoder.encode(userRequestDto.getPassword()));
        user.setPhone(userRequestDto.getPhone());

        try {
            user.setRole(Role.valueOf(userRequestDto.getRole().toUpperCase()));
        } catch (Exception e) {
            throw new RoleNotFoundException("Invalid role: " + userRequestDto.getRole()
            + ". Valid roles: ADMIN, MANAGER, NETWORK_ENGINEER, FIELD_ENGINEER, AUDITOR");
        }

        user.setStatus(Status.INACTIVE);
        userRepo.save(user);
        return "User registered successfully. Waiting for admin approval.";
    }

    // ✅ Login
    @Override
    public UserResponseDto signIn(String email, String password) {
        User user = userRepo.findByEmail(email);

        if (user == null || !encoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (user.getStatus() == Status.INACTIVE) {
            throw new AccountNotActiveException("Account pending admin approval.");
        }

        if (user.getStatus() == Status.SUSPENDED) {
            throw new AccountSuspendedException("Account has been suspended. Contact admin.");
        }

        return UserMapper.mapToDto(user);
    }

    // ✅ Forgot Password
    @Override
    public String changePassword(String email, String newPassword) {

        User user = userRepo.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }

        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);
        return "Password updated successfully";
    }

    // ✅ Update Profile
    @Override
    public String updateProfile(String email, UserRequestDto updatedUser) {

        User user = userRepo.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }

        user.setName(updatedUser.getName());
        user.setPhone(updatedUser.getPhone());
        userRepo.save(user);
        return "Profile updated successfully";
    }

    // ✅ Get All Users
    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepo.findAll().stream()
                    .map(UserMapper::mapToDto)
                    .toList();
    }

    // ✅ Update Role
    @Override
    public String updateRole(Integer userId, String role) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        try {
            user.setRole(Role.valueOf(role.toUpperCase()));
        } catch (Exception e) {
            throw new RoleNotFoundException("Invalid role: " + role
            + ". Valid roles: ADMIN, MANAGER, NETWORK_ENGINEER, FIELD_ENGINEER, AUDITOR");
        }

        user.setStatus(Status.ACTIVE);
        userRepo.save(user);
        return "User role updated by an admin";
    }

    // ✅ Block User
    @Override
    public String blockUser(Integer userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (user.getStatus() == Status.SUSPENDED) {
            throw new AccountSuspendedException("User is already suspended");
        }

        user.setStatus(Status.SUSPENDED);
        userRepo.save(user);
        return "User blocked successfully";
    }

    // ✅ Unblock User — re-activate a SUSPENDED account
    @Override
    public String unblockUser(Integer userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (user.getStatus() == Status.ACTIVE) {
            throw new AccountNotActiveException("User is already active");
        }

        user.setStatus(Status.ACTIVE);
        userRepo.save(user);
        return "User unblocked successfully";
    }

    // ✅ Delete User — hard delete, admin only
    @Override
    public String deleteUser(Integer userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        userRepo.delete(user);
        return "User deleted successfully";
    }

    // ✅ Approve User
    @Override
    public String approveUser(Integer userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (user.getStatus() == Status.ACTIVE) {
            throw new UserAlreadyExistsException("User is already active");
        }

        user.setStatus(Status.ACTIVE);
        userRepo.save(user);
        return "User approved successfully";
    }

    // ✅ Get Pending Users
    @Override
    public List<UserResponseDto> getPendingUsers() {
        return userRepo.findByStatus(Status.INACTIVE).stream()
                       .map(UserMapper::mapToDto)
                       .toList();
    }
}
