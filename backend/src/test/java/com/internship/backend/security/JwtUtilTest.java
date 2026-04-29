package com.internship.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();

        ReflectionTestUtils.setField(
                jwtUtil,
                "secretKey",
                "myverystrongsecretkey1234567890123456"
        );
    }

    @Test
    void generateToken_shouldCreateToken() {

        String token = jwtUtil.generateToken("admin");

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }
}