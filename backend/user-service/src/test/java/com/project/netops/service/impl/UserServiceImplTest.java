package com.project.netops.service.impl;

import com.project.netops.dto.request.UserRequestDto;
import com.project.netops.dto.response.UserResponseDto;
import com.project.netops.exception.AccountNotActiveException;
import com.project.netops.exception.AccountSuspendedException;
import com.project.netops.exception.InvalidCredentialsException;
import com.project.netops.exception.RoleNotFoundException;
import com.project.netops.exception.UserAlreadyExistsException;
import com.project.netops.exception.UserNotFoundException;
import com.project.netops.model.User;
import com.project.netops.repository.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private PasswordEncoder encoder;

    @InjectMocks
    private UserServiceImpl userService;

    private UserRequestDto signUpRequest;
    private User existingUser;

    @BeforeEach
    void setUp() {
        signUpRequest = new UserRequestDto();
        signUpRequest.setName("Alice");
        signUpRequest.setEmail("alice@example.com");
        signUpRequest.setPassword("plaintext");
        signUpRequest.setPhone("555-0100");
        signUpRequest.setRole("ADMIN");

        existingUser = new User();
        existingUser.setUserId(1);
        existingUser.setName("Alice");
        existingUser.setEmail("alice@example.com");
        existingUser.setPassword("encoded");
        existingUser.setPhone("555-0100");
        existingUser.setRole(User.Role.ADMIN);
        existingUser.setStatus(User.Status.ACTIVE);
    }

    @Test
    @DisplayName("signUp persists a new INACTIVE user with encoded password")
    void signUp_savesNewUserAsInactive() {
        when(userRepo.findByEmail("alice@example.com")).thenReturn(null);
        when(encoder.encode("plaintext")).thenReturn("encoded");

        String result = userService.signUp(signUpRequest);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(captor.capture());
        User saved = captor.getValue();

        assertEquals("alice@example.com", saved.getEmail());
        assertEquals("encoded", saved.getPassword());
        assertEquals(User.Role.ADMIN, saved.getRole());
        assertEquals(User.Status.INACTIVE, saved.getStatus());
        assertEquals("User registered successfully. Waiting for admin approval.", result);
    }

    @Test
    @DisplayName("signUp throws when email is already registered")
    void signUp_throwsWhenEmailExists() {
        when(userRepo.findByEmail("alice@example.com")).thenReturn(existingUser);

        assertThrows(UserAlreadyExistsException.class, () -> userService.signUp(signUpRequest));
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("signUp throws RoleNotFoundException for an invalid role")
    void signUp_throwsOnInvalidRole() {
        signUpRequest.setRole("SUPER_USER");
        when(userRepo.findByEmail(anyString())).thenReturn(null);
        when(encoder.encode(anyString())).thenReturn("encoded");

        assertThrows(RoleNotFoundException.class, () -> userService.signUp(signUpRequest));
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("signIn returns DTO when credentials are valid and user is ACTIVE")
    void signIn_returnsDtoForActiveUser() {
        when(userRepo.findByEmail("alice@example.com")).thenReturn(existingUser);
        when(encoder.matches("plaintext", "encoded")).thenReturn(true);

        UserResponseDto dto = userService.signIn("alice@example.com", "plaintext");

        assertNotNull(dto);
        assertEquals("alice@example.com", dto.getEmail());
        assertEquals("ADMIN", dto.getRole());
        assertEquals("ACTIVE", dto.getStatus());
    }

    @Test
    @DisplayName("signIn throws when the user does not exist")
    void signIn_throwsWhenUserMissing() {
        when(userRepo.findByEmail("missing@example.com")).thenReturn(null);

        assertThrows(InvalidCredentialsException.class,
                () -> userService.signIn("missing@example.com", "x"));
    }

    @Test
    @DisplayName("signIn throws when the password does not match")
    void signIn_throwsOnPasswordMismatch() {
        when(userRepo.findByEmail("alice@example.com")).thenReturn(existingUser);
        when(encoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class,
                () -> userService.signIn("alice@example.com", "wrong"));
    }

    @Test
    @DisplayName("signIn throws AccountNotActiveException for INACTIVE users")
    void signIn_throwsWhenInactive() {
        existingUser.setStatus(User.Status.INACTIVE);
        when(userRepo.findByEmail("alice@example.com")).thenReturn(existingUser);
        when(encoder.matches("plaintext", "encoded")).thenReturn(true);

        assertThrows(AccountNotActiveException.class,
                () -> userService.signIn("alice@example.com", "plaintext"));
    }

    @Test
    @DisplayName("signIn throws AccountSuspendedException for SUSPENDED users")
    void signIn_throwsWhenSuspended() {
        existingUser.setStatus(User.Status.SUSPENDED);
        when(userRepo.findByEmail("alice@example.com")).thenReturn(existingUser);
        when(encoder.matches("plaintext", "encoded")).thenReturn(true);

        assertThrows(AccountSuspendedException.class,
                () -> userService.signIn("alice@example.com", "plaintext"));
    }

    @Test
    @DisplayName("changePassword updates the encoded password and saves")
    void changePassword_updatesEncodedPassword() {
        when(userRepo.findByEmail("alice@example.com")).thenReturn(existingUser);
        when(encoder.encode("newPass")).thenReturn("newEncoded");

        String msg = userService.changePassword("alice@example.com", "newPass");

        assertEquals("Password updated successfully", msg);
        assertEquals("newEncoded", existingUser.getPassword());
        verify(userRepo).save(existingUser);
    }

    @Test
    @DisplayName("changePassword throws when user is not found")
    void changePassword_throwsWhenUserMissing() {
        when(userRepo.findByEmail("missing@example.com")).thenReturn(null);

        assertThrows(UserNotFoundException.class,
                () -> userService.changePassword("missing@example.com", "x"));
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("updateProfile updates name and phone")
    void updateProfile_updatesNameAndPhone() {
        UserRequestDto update = new UserRequestDto();
        update.setName("Alice Updated");
        update.setPhone("555-9999");
        when(userRepo.findByEmail("alice@example.com")).thenReturn(existingUser);

        String msg = userService.updateProfile("alice@example.com", update);

        assertEquals("Profile updated successfully", msg);
        assertEquals("Alice Updated", existingUser.getName());
        assertEquals("555-9999", existingUser.getPhone());
        verify(userRepo).save(existingUser);
    }

    @Test
    @DisplayName("updateProfile throws when user is missing")
    void updateProfile_throwsWhenMissing() {
        when(userRepo.findByEmail(anyString())).thenReturn(null);
        assertThrows(UserNotFoundException.class,
                () -> userService.updateProfile("x@x.com", new UserRequestDto()));
    }

    @Test
    @DisplayName("getAllUsers returns DTOs for every user")
    void getAllUsers_returnsMappedDtos() {
        when(userRepo.findAll()).thenReturn(List.of(existingUser));

        List<UserResponseDto> users = userService.getAllUsers();

        assertEquals(1, users.size());
        assertEquals("alice@example.com", users.get(0).getEmail());
    }

    @Test
    @DisplayName("getAllUsers returns empty list when no users exist")
    void getAllUsers_returnsEmptyListWhenEmpty() {
        when(userRepo.findAll()).thenReturn(Collections.emptyList());
        assertEquals(0, userService.getAllUsers().size());
    }

    @Test
    @DisplayName("updateRole flips role to the requested value and marks user ACTIVE")
    void updateRole_activatesUser() {
        existingUser.setStatus(User.Status.INACTIVE);
        existingUser.setRole(User.Role.AUDITOR);
        when(userRepo.findById(1)).thenReturn(Optional.of(existingUser));

        String msg = userService.updateRole(1, "manager");

        assertEquals("User role updated by an admin", msg);
        assertEquals(User.Role.MANAGER, existingUser.getRole());
        assertEquals(User.Status.ACTIVE, existingUser.getStatus());
        verify(userRepo).save(existingUser);
    }

    @Test
    @DisplayName("updateRole throws UserNotFoundException for an unknown id")
    void updateRole_throwsWhenUserMissing() {
        when(userRepo.findById(99)).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class, () -> userService.updateRole(99, "ADMIN"));
    }

    @Test
    @DisplayName("updateRole rejects an invalid role string")
    void updateRole_throwsOnInvalidRole() {
        when(userRepo.findById(1)).thenReturn(Optional.of(existingUser));
        assertThrows(RoleNotFoundException.class, () -> userService.updateRole(1, "GHOST"));
    }

    @Test
    @DisplayName("blockUser suspends an ACTIVE user")
    void blockUser_suspendsActiveUser() {
        when(userRepo.findById(1)).thenReturn(Optional.of(existingUser));

        String msg = userService.blockUser(1);

        assertEquals("User blocked successfully", msg);
        assertEquals(User.Status.SUSPENDED, existingUser.getStatus());
        verify(userRepo).save(existingUser);
    }

    @Test
    @DisplayName("blockUser throws when the user is already SUSPENDED")
    void blockUser_throwsWhenAlreadySuspended() {
        existingUser.setStatus(User.Status.SUSPENDED);
        when(userRepo.findById(1)).thenReturn(Optional.of(existingUser));

        assertThrows(AccountSuspendedException.class, () -> userService.blockUser(1));
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("approveUser activates an INACTIVE user")
    void approveUser_activatesInactive() {
        existingUser.setStatus(User.Status.INACTIVE);
        when(userRepo.findById(1)).thenReturn(Optional.of(existingUser));

        String msg = userService.approveUser(1);

        assertEquals("User approved successfully", msg);
        assertEquals(User.Status.ACTIVE, existingUser.getStatus());
        verify(userRepo).save(existingUser);
    }

    @Test
    @DisplayName("approveUser throws when the user is already ACTIVE")
    void approveUser_throwsWhenAlreadyActive() {
        when(userRepo.findById(1)).thenReturn(Optional.of(existingUser));

        assertThrows(UserAlreadyExistsException.class, () -> userService.approveUser(1));
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("getPendingUsers returns only users with INACTIVE status")
    void getPendingUsers_returnsInactiveOnly() {
        User pending = new User();
        pending.setUserId(2);
        pending.setName("Bob");
        pending.setEmail("bob@example.com");
        pending.setRole(User.Role.NETWORK_ENGINEER);
        pending.setStatus(User.Status.INACTIVE);
        when(userRepo.findByStatus(User.Status.INACTIVE)).thenReturn(List.of(pending));

        List<UserResponseDto> dtos = userService.getPendingUsers();

        assertEquals(1, dtos.size());
        assertEquals("bob@example.com", dtos.get(0).getEmail());
        verify(userRepo, times(1)).findByStatus(eq(User.Status.INACTIVE));
    }

    @Test
    @DisplayName("getPendingUsers returns empty list when there are no pending users")
    void getPendingUsers_returnsEmptyListWhenEmpty() {
        when(userRepo.findByStatus(User.Status.INACTIVE)).thenReturn(Collections.emptyList());
        assertEquals(0, userService.getPendingUsers().size());
    }
}
