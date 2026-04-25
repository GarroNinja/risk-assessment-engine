package com.internship.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.backend.entity.RiskRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for RiskRecord and Auth endpoints.
 * Uses in-memory H2 database — no external services needed.
 *
 * Run with: ./mvnw test
 */
@SpringBootTest
@AutoConfigureMockMvc
class RiskRecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private RiskRecord sampleRecord;

    @BeforeEach
    void setUp() {
        sampleRecord = new RiskRecord();
        sampleRecord.setTitle("SQL Injection Risk");
        sampleRecord.setDescription("Input fields not sanitised");
        sampleRecord.setCategory("Security");
        sampleRecord.setStatus("OPEN");
        sampleRecord.setRiskScore(85);
    }

    // ── Auth endpoint tests ──────────────────────────────────────────────────

    @Test
    void register_shouldReturn201_withValidPayload() throws Exception {
        String payload = """
                {
                  "username": "testuser_%d",
                  "email": "test_%d@example.com",
                  "password": "password123"
                }
                """.formatted(System.currentTimeMillis(), System.currentTimeMillis());

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("VIEWER"));
    }

    @Test
    void login_shouldReturn200_withValidCredentials() throws Exception {
        // First register
        long ts = System.currentTimeMillis();
        String registerPayload = """
                {"username":"logintest_%d","email":"login_%d@ex.com","password":"pass123"}
                """.formatted(ts, ts);
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerPayload));

        // Then login
        String loginPayload = """
                {"username":"logintest_%d","password":"pass123"}
                """.formatted(ts);
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void login_shouldReturn400_withWrongPassword() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"nobody\",\"password\":\"wrong\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── RiskRecord endpoint tests ────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MANAGER")
    void createRecord_shouldReturn201_withValidPayload() throws Exception {
        mockMvc.perform(post("/api/risk-records/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleRecord)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("SQL Injection Risk"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void createRecord_shouldReturn403_forViewer() throws Exception {
        mockMvc.perform(post("/api/risk-records/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleRecord)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAll_shouldReturn401_withoutToken() throws Exception {
        mockMvc.perform(get("/api/risk-records/all"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getAll_shouldReturn200_withPagination() throws Exception {
        mockMvc.perform(get("/api/risk-records/all")
                .param("page", "0")
                .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageable").exists());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getById_shouldReturn404_forNonExistentId() throws Exception {
        mockMvc.perform(get("/api/risk-records/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateRecord_shouldReturn200_withChangedFields() throws Exception {
        // Create first
        MvcResult result = mockMvc.perform(post("/api/risk-records/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleRecord)))
                .andReturn();

        RiskRecord created = objectMapper.readValue(
                result.getResponse().getContentAsString(), RiskRecord.class);

        // Update
        created.setStatus("CLOSED");
        created.setTitle("Updated Title");

        mockMvc.perform(put("/api/risk-records/" + created.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteRecord_shouldReturn204() throws Exception {
        // Create first
        MvcResult result = mockMvc.perform(post("/api/risk-records/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleRecord)))
                .andReturn();

        RiskRecord created = objectMapper.readValue(
                result.getResponse().getContentAsString(), RiskRecord.class);

        // Delete
        mockMvc.perform(delete("/api/risk-records/" + created.getId()))
                .andExpect(status().isNoContent());

        // Confirm it's gone
        mockMvc.perform(get("/api/risk-records/" + created.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void search_shouldReturn200_withResults() throws Exception {
        mockMvc.perform(get("/api/risk-records/search")
                .param("q", "SQL")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getStats_shouldReturn200_withKpiFields() throws Exception {
        mockMvc.perform(get("/api/risk-records/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").isNumber())
                .andExpect(jsonPath("$.openCount").isNumber())
                .andExpect(jsonPath("$.highRiskCount").isNumber());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void exportCsv_shouldReturnCsvContentType() throws Exception {
        mockMvc.perform(get("/api/risk-records/export"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"));
    }
}
