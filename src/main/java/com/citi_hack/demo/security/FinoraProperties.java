package com.citi_hack.demo.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

@ConfigurationProperties(prefix = "finora")
public record FinoraProperties(@DefaultValue Jwt jwt, @DefaultValue Security security) {

    public record Jwt(
            String secret,
            @DefaultValue("finora") String issuer,
            @DefaultValue("15") long accessTokenMinutes,
            @DefaultValue("14") long refreshTokenDays) {
    }

    public record Security(
            @DefaultValue("/api/scams/**") List<String> publicPaths,
            @DefaultValue("http://localhost:5173") List<String> allowedOrigins,
            @DefaultValue("5") int maxFailedAttempts,
            @DefaultValue("15") long lockMinutes) {
    }
}
