package com.citi_hack.demo.auth.dto;

public record AuthResponse(
        String tokenType,
        String accessToken,
        long expiresIn,
        String refreshToken,
        UserResponse user) {
}
