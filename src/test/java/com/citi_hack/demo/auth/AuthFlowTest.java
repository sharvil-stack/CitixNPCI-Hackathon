package com.citi_hack.demo.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthFlowTest {

    private static final String PASSWORD = "Sup3rSecret";

    @Autowired
    private WebApplicationContext context;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    private static String registerJson(String email, String password) {
        return "{\"fullName\":\"Test User\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    private static String loginJson(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    private MvcResult call(String url, String json) throws Exception {
        return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json)).andReturn();
    }

    private static String field(MvcResult result, String name) throws Exception {
        Matcher m = Pattern.compile("\"" + name + "\"\\s*:\\s*\"([^\"]+)\"")
                .matcher(result.getResponse().getContentAsString());
        assertTrue(m.find(), "field " + name + " not found in " + result.getResponse().getContentAsString());
        return m.group(1);
    }

    @Test
    void registerReturnsTokensAndNormalizesEmail() throws Exception {
        String email = uniqueEmail();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(email.toUpperCase(), PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("password"))));
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String email = uniqueEmail();
        call("/api/auth/register", registerJson(email, PASSWORD));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(email, PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("email_taken"));
    }

    @Test
    void weakOrInvalidInputIsRejected() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(uniqueEmail(), "short1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"))
                .andExpect(jsonPath("$.fieldErrors.password").exists());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("not-an-email", PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("malformed_request"));
    }

    @Test
    void loginSucceedsAndMeReturnsProfile() throws Exception {
        String email = uniqueEmail();
        call("/api/auth/register", registerJson(email, PASSWORD));

        MvcResult login = call("/api/auth/login", loginJson(email, PASSWORD));
        org.junit.jupiter.api.Assertions.assertEquals(200, login.getResponse().getStatus());

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + field(login, "accessToken")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Test User"));
    }

    @Test
    void wrongPasswordAndUnknownEmailGiveSameError() throws Exception {
        String email = uniqueEmail();
        call("/api/auth/register", registerJson(email, PASSWORD));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, "WrongPass1")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(uniqueEmail(), PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"));
    }

    @Test
    void protectedEndpointsNeedAValidToken() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("unauthorized"));
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer garbage.token.value"))
                .andExpect(status().isUnauthorized());
        // Any route that is not explicitly public requires authentication.
        mvc.perform(get("/api/anything-else")).andExpect(status().isUnauthorized());
        // Explicitly public path from application-test.properties is reachable without a token.
        mvc.perform(get("/api/scams/examples")).andExpect(status().isOk());
    }

    @Test
    void refreshRotatesTokenAndReuseIsDetected() throws Exception {
        String email = uniqueEmail();
        MvcResult reg = call("/api/auth/register", registerJson(email, PASSWORD));
        String first = field(reg, "refreshToken");

        MvcResult rotated = call("/api/auth/refresh", "{\"refreshToken\":\"" + first + "\"}");
        org.junit.jupiter.api.Assertions.assertEquals(200, rotated.getResponse().getStatus());
        String second = field(rotated, "refreshToken");
        org.junit.jupiter.api.Assertions.assertNotEquals(first, second);

        // Replaying the old token fails and burns the whole family, including the new token.
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + first + "\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + second + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        MvcResult reg = call("/api/auth/register", registerJson(uniqueEmail(), PASSWORD));
        String refresh = field(reg, "refreshToken");
        String body = "{\"refreshToken\":\"" + refresh + "\"}";

        mvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNoContent()); // idempotent
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void accountLocksAfterRepeatedFailures() throws Exception {
        String email = uniqueEmail();
        call("/api/auth/register", registerJson(email, PASSWORD));

        // max-failed-attempts=3 in application-test.properties
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content(loginJson(email, "WrongPass1")))
                    .andExpect(status().isUnauthorized());
        }
        // Even the correct password is refused while locked.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, PASSWORD)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("account_locked"));
    }
}

