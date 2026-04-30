package com.internship.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.cache.type=none",
    "spring.main.allow-circular-references=true",
    "spring.mail.host=localhost",
    "spring.mail.port=3025",
    "spring.mail.username=test",
    "spring.mail.password=test",
    "spring.data.redis.host=localhost"
})
@AutoConfigureMockMvc
@Testcontainers
class RiskRecordIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:15")
                    .withDatabaseName("riskdb_test")
                    .withUsername("testuser")
                    .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name",
                () -> "org.postgresql.Driver");
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "MANAGER")
    void createRecord_shouldReturn201_withRealPostgres() throws Exception {
        String payload = """
                {
                  "title": "Integration Test Risk",
                  "description": "Testing with real PostgreSQL",
                  "category": "Security",
                  "status": "OPEN",
                  "riskScore": 75
                }
                """;
        mockMvc.perform(post("/api/risk-records/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title")
                        .value("Integration Test Risk"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getAllRecords_shouldReturn200_withRealPostgres() throws Exception {
        mockMvc.perform(get("/api/risk-records/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getStats_shouldReturn200_withRealPostgres() throws Exception {
        mockMvc.perform(get("/api/risk-records/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").isNumber());
    }
}