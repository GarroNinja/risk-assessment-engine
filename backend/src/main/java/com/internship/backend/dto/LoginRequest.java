package com.internship.backend.dto;

import lombok.Data;

/** Sent by client on POST /auth/login */
@Data
public class LoginRequest {
    private String username;
    private String password;
}
