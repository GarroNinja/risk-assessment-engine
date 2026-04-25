package com.internship.backend.dto;

import lombok.Data;

/** Sent by client on POST /auth/register */
@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
}
