package com.project.netops.integration;

import com.project.netops.model.User;
import com.project.netops.repository.UserRepo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Boots the full user-service Spring context with an H2 in-memory database.
 * Exercises the complete auth chain through the real controllers, services,
 * Spring Security filter chain, JWT util and JPA layer.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserAuthFlowIntegrationTest {

    private static final String SIGNUP_ALICE =
            "{\"name\":\"Alice\",\"email\":\"alice@itest.com\"," +
            "\"password\":\"secret\",\"role\":\"ADMIN\"}";

    private static final String LOGIN_ALICE =
            "{\"email\":\"alice@itest.com\",\"password\":\"secret\"}";

    private static final String SIGNUP_BOB =
            "{\"name\":\"Bob\",\"email\":\"bob@itest.com\"," +
            "\"password\":\"correct\",\"role\":\"NETWORK_ENGINEER\"}";

    private static final String LOGIN_BOB_WRONG =
            "{\"email\":\"bob@itest.com\",\"password\":\"WRONG\"}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepo userRepo;

    @Test
    @DisplayName("Full auth flow: signup -> reject login (INACTIVE) -> activate -> login -> JWT -> protected call -> reject anonymous")
    void fullAuthFlow() throws Exception {
        // 1. Sign up - user starts INACTIVE
        mockMvc.perform(post("/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SIGNUP_ALICE))
                .andExpect(status().isCreated())
                .andExpect(content().string(containsString("registered successfully")));

        // 2. Login while INACTIVE -> 403 Forbidden (AccountNotActiveException)
        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_ALICE))
                .andExpect(status().isForbidden());

        // 3. Admin activates Alice directly via repo (simulates admin clicking 'approve')
        User alice = userRepo.findByEmail("alice@itest.com");
        assertNotNull(alice, "Alice should have been persisted by signup");
        alice.setStatus(User.Status.ACTIVE);
        userRepo.save(alice);

        // 4. Login now succeeds and returns a real JWT
        MvcResult loginResult = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_ALICE))
                .andExpect(status().isOk())
                .andExpect(content().string(startsWith("eyJ")))   // looks like a JWT
                .andReturn();
        String token = loginResult.getResponse().getContentAsString();
        assertTrue(token.split("\\.").length == 3, "JWT should have 3 segments");

        // 5. Use that JWT to call the ADMIN-protected /users endpoint
        mockMvc.perform(get("/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("alice@itest.com"))
                .andExpect(jsonPath("$[0].role").value("ADMIN"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        // 6. Same endpoint WITHOUT a token -> rejected
        mockMvc.perform(get("/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Login with wrong password is rejected with 401")
    void loginWithWrongPasswordIsRejected() throws Exception {
        // seed an ACTIVE user
        mockMvc.perform(post("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(SIGNUP_BOB))
                .andExpect(status().isCreated());
        User bob = userRepo.findByEmail("bob@itest.com");
        bob.setStatus(User.Status.ACTIVE);
        userRepo.save(bob);

        // wrong password
        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BOB_WRONG))
                .andExpect(status().isUnauthorized());
    }
}
