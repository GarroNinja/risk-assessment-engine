package com.internship.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Returned to client after successful login or register */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String role;
}
