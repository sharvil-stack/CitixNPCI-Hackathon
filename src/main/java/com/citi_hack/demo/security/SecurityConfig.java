package com.citi_hack.demo.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableConfigurationProperties(FinoraProperties.class)
public class SecurityConfig {

    private static final String[] ALWAYS_PUBLIC = {
            "/api/auth/register", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout", "/error"
    };

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, FinoraProperties props) {
        List<String> publicPaths = props.security().publicPaths().stream()
                .map(String::trim).filter(p -> !p.isEmpty()).toList();

        http
                .csrf(AbstractHttpConfigurer::disable) // stateless bearer-token API, no cookies/sessions
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    auth.requestMatchers(ALWAYS_PUBLIC).permitAll();
                    if (!publicPaths.isEmpty()) {
                        auth.requestMatchers(publicPaths.toArray(String[]::new)).permitAll();
                    }
                    auth.anyRequest().authenticated();
                })
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler()));
        return http.build();
    }

    /** Maps the "roles" claim (already ROLE_-prefixed) straight to authorities. */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    private AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, ex) -> writeJson(response, 401, "Bearer",
                "{\"error\":\"unauthorized\",\"message\":\"Please sign in to continue.\"}");
    }

    private AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> writeJson(response, 403, null,
                "{\"error\":\"forbidden\",\"message\":\"You do not have access to this resource.\"}");
    }

    private static void writeJson(jakarta.servlet.http.HttpServletResponse response, int status,
                                  String wwwAuthenticate, String body) throws IOException {
        response.setStatus(status);
        if (wwwAuthenticate != null) {
            response.setHeader("WWW-Authenticate", wwwAuthenticate);
        }
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(body);
    }


    @Bean
    CorsConfigurationSource corsConfigurationSource(FinoraProperties props) {
        CorsConfiguration cors = new CorsConfiguration();

        cors.setAllowedOriginPatterns(props.security().allowedOrigins());

        cors.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        cors.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "Accept", "Origin"
        ));

        cors.setAllowCredentials(false);
        cors.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", cors);
        return source;
    }

}

