package com.citi_hack.demo.auth;

import com.citi_hack.demo.auth.dto.*;
import com.citi_hack.demo.common.ApiException;
import com.citi_hack.demo.user.Role;
import com.citi_hack.demo.user.User;
import com.citi_hack.demo.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.citi_hack.demo.security.FinoraProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FinoraProperties props;

    private final SecureRandom random = new SecureRandom();
    /** Compared against when the email is unknown so response time doesn't reveal which emails exist. */
    private final String dummyHash;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder, JwtService jwtService, FinoraProperties props) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.props = props;
        this.dummyHash = passwordEncoder.encode("not-a-real-password-1");
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalizeEmail(req.email());
        if (tooLongForBcrypt(req.password())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "validation_failed", "Password is too long.");
        }
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken", "An account with this email already exists.");
        }
        User user = users.saveAndFlush(new User(
                req.fullName().trim(), email, passwordEncoder.encode(req.password()), Role.USER));
        return issueTokens(user);
    }

    // ApiException must not roll back: the failed-attempt counter has to be persisted.
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse login(LoginRequest req) {
        Instant now = Instant.now();
        if (tooLongForBcrypt(req.password())) {
            throw invalidCredentials(); // can never match; also avoids BCrypt's >72-byte exception
        }
        Optional<User> found = users.findByEmail(normalizeEmail(req.email()));
        if (found.isEmpty()) {
            passwordEncoder.matches(req.password(), dummyHash);
            throw invalidCredentials();
        }
        User user = found.get();
        if (user.isLocked(now)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "account_locked",
                    "Too many failed attempts. Try again in a few minutes.");
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            user.registerFailedAttempt(props.security().maxFailedAttempts(),
                    Duration.ofMinutes(props.security().lockMinutes()), now);
            throw invalidCredentials();
        }
        user.resetFailedAttempts();
        return issueTokens(user);
    }

    /**
     * Rotates the refresh token: the presented one is revoked and a new pair is returned.
     * Presenting an already-revoked token means it was probably stolen, so every session of that user is revoked.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokens.findByTokenHash(hash(rawRefreshToken))
                .orElseThrow(AuthService::invalidRefreshToken);
        if (stored.isRevoked()) {
            refreshTokens.revokeAllForUser(stored.getUser().getId());
            throw invalidRefreshToken();
        }
        if (stored.isExpired(Instant.now())) {
            throw invalidRefreshToken();
        }
        stored.revoke();
        return issueTokens(stored.getUser());
    }

    /** Idempotent: unknown or already-revoked tokens are ignored. */
    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokens.findByTokenHash(hash(rawRefreshToken)).ifPresent(RefreshToken::revoke);
    }

    @Transactional(readOnly = true)
    public User currentUser(Long userId) {
        return users.findById(userId).orElseThrow(() ->
                new ApiException(HttpStatus.UNAUTHORIZED, "unauthorized", "Account no longer exists."));
    }

    private AuthResponse issueTokens(User user) {
        String access = jwtService.createAccessToken(user);

        byte[] bytes = new byte[48];
        random.nextBytes(bytes);
        String rawRefresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expires = Instant.now().plus(Duration.ofDays(props.jwt().refreshTokenDays()));
        refreshTokens.save(new RefreshToken(hash(rawRefresh), user, expires));

        return new AuthResponse("Bearer", access, jwtService.accessTokenTtl().toSeconds(),
                rawRefresh, UserResponse.from(user));
    }

    private static boolean tooLongForBcrypt(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length > 72;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", "Incorrect email or password.");
    }

    private static ApiException invalidRefreshToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "invalid_refresh_token",
                "Session expired. Please sign in again.");
    }
}

