package com.project.netops.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.netops.dto.request.UserRequestDto;
import com.project.netops.dto.response.UserResponseDto;
import com.project.netops.security.JwtUtil;
import com.project.netops.service.UserService;

@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<String> register(@RequestBody UserRequestDto userRequestDto) {
        String response = userService.signUp(userRequestDto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserRequestDto userRequestDto) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(userRequestDto.getEmail(), userRequestDto.getPassword())
        );
        UserResponseDto user = userService.signIn(userRequestDto.getEmail(), userRequestDto.getPassword());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return new ResponseEntity<>(token, HttpStatus.OK);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> data) {
        String email = data.get("email");
        String newPassword = data.get("newPassword");
        String response = userService.changePassword(email, newPassword);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/update-profile")
    public ResponseEntity<String> updateProfile(@RequestParam String email, @RequestBody UserRequestDto updatedUser) {
        String response = userService.updateProfile(email, updatedUser);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        List<UserResponseDto> users = userService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @PutMapping("/update-role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateRole(@RequestParam Integer userId, @RequestParam String role) {
        String response = userService.updateRole(userId, role);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/block-user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> blockUser(@RequestParam Integer userId) {
        String response = userService.blockUser(userId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/pending-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDto>> getPendingUsers() {
        List<UserResponseDto> users = userService.getPendingUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @PutMapping("/approve-user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> approveUser(@RequestParam Integer userId) {
        String response = userService.approveUser(userId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
