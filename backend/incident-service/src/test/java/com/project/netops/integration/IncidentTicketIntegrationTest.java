package com.project.netops.integration;

import com.project.netops.model.FaultReport;
import com.project.netops.model.Site;
import com.project.netops.model.User;
import com.project.netops.repository.FaultReportRepository;
import com.project.netops.repository.SiteRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cross-domain JPA round-trip:
 *   Site + User + FaultReport are seeded directly in H2 (using the shared
 *   entities from `common`), then a new IncidentTicket is created via HTTP.
 *
 * Proves that:
 *   - Multiple entity types defined in `common` are visible to incident-service.
 *   - The @ManyToOne relationships from IncidentTicket -> User and
 *     IncidentTicket -> FaultReport persist correctly.
 *   - The @Transactional(readOnly=true) fix on getTicketById actually keeps
 *     the Hibernate session open long enough for the mapper to read the
 *     lazy-loaded User/FaultReport fields without throwing.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IncidentTicketIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserRepo userRepo;
    @Autowired private SiteRepository siteRepo;
    @Autowired private FaultReportRepository faultRepo;

    private Long userId;
    private Long faultId;
    private String bearer;

    @BeforeEach
    void seed() {
        // 1. Seed a user
        User reporter = new User();
        reporter.setName("Reporter");
        reporter.setEmail("reporter@itest.com");
        reporter.setPassword("ignored");
        reporter.setRole(User.Role.NETWORK_ENGINEER);
        reporter.setStatus(User.Status.ACTIVE);
        reporter = userRepo.save(reporter);
        userId = reporter.getUserId().longValue();

        // 2. Seed a site
        Site site = Site.builder()
                .siteCode("SITE-IT-1")
                .name("Integration Site")
                .region("South")
                .status(Site.Status.ACTIVE)
                .build();
        site = siteRepo.save(site);

        // 3. Seed a fault report that the ticket will link to
        FaultReport fault = FaultReport.builder()
                .site(site)
                .reportedBy(reporter)
                .severity(FaultReport.Severity.HIGH)
                .description("Test fault for integration test")
                .status(FaultReport.Status.OPEN)
                .build();
        fault = faultRepo.save(fault);
        faultId = fault.getFaultId();

        bearer = "Bearer " + jwtUtil.generateToken("admin@itest.com", "ADMIN");
    }

    @Test
    @DisplayName("POST /api/v1/tickets persists ticket with cross-domain @ManyToOne to User+FaultReport, " +
                 "GET /api/v1/tickets/{id} hydrates the lazy fields without LazyInit error")
    void createAndFetchTicketWithCrossDomainRelations() throws Exception {
        // POST a new ticket referring to the seeded user + fault
        String createBody = String.format(
                "{\"faultId\":%d,\"createdById\":%d,\"priority\":\"P2\"}",
                faultId, userId);

        MvcResult createResult = mockMvc.perform(post("/api/v1/tickets")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ticketId").isNumber())
                .andExpect(jsonPath("$.data.priority").value("P2"))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andReturn();

        // Extract the ticket ID
        String responseJson = createResult.getResponse().getContentAsString();
        long ticketId = Long.parseLong(responseJson.replaceAll(".*\"ticketId\":(\\d+).*", "$1"));

        // GET it back - this exercises the @Transactional(readOnly=true) fix
        // because the response includes the User's name and FaultReport's id,
        // which are LAZY-loaded.  Without @Transactional this would throw
        // LazyInitializationException.
        mockMvc.perform(get("/api/v1/tickets/" + ticketId)
                        .header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ticketId").value((int) ticketId))
                .andExpect(jsonPath("$.data.priority").value("P2"))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.faultId").value(faultId.intValue()))
                .andExpect(jsonPath("$.data.createdByName").value("Reporter"));

        // And /api/v1/tickets list now includes our ticket
        mockMvc.perform(get("/api/v1/tickets")
                        .header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ticketId").value((int) ticketId))
                .andExpect(jsonPath("$.data[0].createdByName").value("Reporter"));
    }
}
