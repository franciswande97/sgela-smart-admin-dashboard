package com.app.sgelasmart.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Size(max = 255, message = "Email must be at most 255 characters")
    String email,

    // No minimum length or complexity rule on purpose: login must accept whatever the account was created with.
    // 72 is bcrypt's limit - longer passwords are not supported by the hashing algorithm.
    @NotBlank(message = "Password is required")
    @Size(max = 72, message = "Password must be at most 72 characters")
    String password
) {}