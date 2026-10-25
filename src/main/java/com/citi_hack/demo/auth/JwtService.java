package com.citi_hack.demo.auth;

import com.citi_hack.demo.security.FinoraProperties;
import com.citi_hack.demo.user.User;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final FinoraProperties props;

    public JwtService(JwtEncoder encoder, FinoraProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public Duration accessTokenTtl() {
        return Duration.ofMinutes(props.jwt().accessTokenMinutes());
    }

    /** Short-lived signed access token. Subject is the user id; authorities travel in the "roles" claim. */
    public String createAccessToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.jwt().issuer())
                .issuedAt(now)
                .expiresAt(now.plus(accessTokenTtl()))
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("roles", List.of(user.getRole().authority()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
