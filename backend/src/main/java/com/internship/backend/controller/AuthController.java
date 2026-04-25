package com.internship.backend.controller;

import com.internship.backend.dto.AuthResponse;
import com.internship.backend.dto.LoginRequest;
import com.internship.backend.dto.RegisterRequest;
import com.internship.backend.security.JwtUtil;
import com.internship.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Login, register, token refresh")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil     jwtUtil;

    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil     = jwtUtil;
    }

    /** POST /auth/login — returns JWT token */
    @Operation(summary = "Login with username and password")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(response);
    }

    /** POST /auth/register — creates new user with VIEWER role */
    @Operation(summary = "Register a new account (gets VIEWER role)")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        AuthResponse response = authService.register(req);
        return ResponseEntity.status(201).body(response);
    }

    /** POST /auth/refresh — give current user a fresh token */
    @Operation(summary = "Refresh JWT token (must be logged in)")
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(
            @AuthenticationPrincipal UserDetails userDetails) {

        String newToken = jwtUtil.generateToken(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("token", newToken));
    }
}
