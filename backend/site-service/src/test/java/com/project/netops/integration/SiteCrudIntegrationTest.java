package com.project.netops.integration;

import com.project.netops.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full POST -> GET round-trip for the Site resource.
 * Boots the site-service Spring context with H2 in-memory.
 * Real Spring Security, real JWT validation, real JPA, real mapper.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SiteCrudIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("POST /sites then GET /sites/{id} - created site persists and round-trips through JPA + mapper")
    void createSiteThenFetchById() throws Exception {
        String token = jwtUtil.generateToken("admin@itest.com", "ADMIN");
        String bearer = "Bearer " + token;

        // 1. POST a new site
        MvcResult createResult = mockMvc.perform(post("/sites")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"siteCode":"IT-01","name":"Integration Test Site",
                             "region":"South","address":"Test Address",
                             "latitude":13.0,"longitude":80.0,"status":"ACTIVE"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.siteCode").value("IT-01"))
                .andExpect(jsonPath("$.name").value("Integration Test Site"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.siteId").isNumber())
                .andReturn();

        // Pull the generated ID out of the response
        String body = createResult.getResponse().getContentAsString();
        long siteId = Long.parseLong(body.replaceAll(".*\"siteId\":(\\d+).*", "$1"));
        assertTrue(siteId > 0, "Site ID should be generated");

        // 2. GET it back by ID and verify every field made the round trip
        mockMvc.perform(get("/sites/" + siteId)
                        .header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.siteId").value((int) siteId))
                .andExpect(jsonPath("$.siteCode").value("IT-01"))
                .andExpect(jsonPath("$.name").value("Integration Test Site"))
                .andExpect(jsonPath("$.region").value("South"))
                .andExpect(jsonPath("$.address").value("Test Address"))
                .andExpect(jsonPath("$.latitude").value(13.0))
                .andExpect(jsonPath("$.longitude").value(80.0))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // 3. GET /sites includes the new one
        mockMvc.perform(get("/sites")
                        .header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].siteCode").value("IT-01"));
    }

    @Test
    @DisplayName("POST /sites with empty name returns 400 BadRequest")
    void createSiteValidationRejectsEmptyName() throws Exception {
        String token = jwtUtil.generateToken("admin@itest.com", "ADMIN");
        mockMvc.perform(post("/sites")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"siteCode":"BAD","name":"",
                             "status":"ACTIVE"}
                            """))
                .andExpect(status().isBadRequest());
    }
}
