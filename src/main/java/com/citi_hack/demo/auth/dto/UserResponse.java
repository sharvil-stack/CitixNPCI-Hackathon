package com.citi_hack.demo.auth.dto;

import com.citi_hack.demo.user.User;

import java.time.Instant;

public record UserResponse(Long id, String fullName, String email, String role, Instant createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole().name(), u.getCreatedAt());
    }
}

