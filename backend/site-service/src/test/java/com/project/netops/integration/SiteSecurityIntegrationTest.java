package com.project.netops.integration;

import com.project.netops.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proves that site-service correctly enforces JWT authentication
 * even though the JWTs are issued by a DIFFERENT microservice (user-service).
 * In this test, we mint a valid token using site-service's own JwtUtil
 * configured with the same shared secret - that's exactly how cross-service
 * auth works in the real microservices stack.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SiteSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("GET /sites without Authorization header -> 403 Forbidden")
    void anonymousRequestIsRejected() throws Exception {
        mockMvc.perform(get("/sites"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /sites with bogus token -> 403 Forbidden")
    void invalidTokenIsRejected() throws Exception {
        mockMvc.perform(get("/sites")
                        .header("Authorization", "Bearer not.a.real.jwt"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /sites with valid token minted by same shared secret -> 200 OK")
    void validJwtIsAccepted() throws Exception {
        String token = jwtUtil.generateToken("alice@itest.com", "ADMIN");
        mockMvc.perform(get("/sites")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
