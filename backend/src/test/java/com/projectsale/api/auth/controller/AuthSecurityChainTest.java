package com.projectsale.api.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.projectsale.api.auth.security.JwtAuthenticationFilter;
import com.projectsale.api.auth.security.JwtService;
import com.projectsale.api.auth.security.RateLimitingFilter;
import com.projectsale.api.auth.security.dto.AccessTokenClaims;
import com.projectsale.api.auth.security.oauth2.BindingAuthorizationRequestResolver;
import com.projectsale.api.auth.security.oauth2.OAuth2LoginFailureHandler;
import com.projectsale.api.auth.security.oauth2.OAuth2LoginProperties;
import com.projectsale.api.auth.security.oauth2.OAuth2LoginSuccessHandler;
import com.projectsale.api.auth.service.AuthService;
import com.projectsale.api.auth.service.CustomOidcUserService;
import com.projectsale.api.auth.service.OAuth2LoginCodeService;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.config.RestAuthenticationEntryPoint;
import com.projectsale.common.config.SecurityConfig;
import com.projectsale.common.web.ClientRequestResolver;
import com.projectsale.common.web.ProxyProperties;
import com.projectsale.entity.User;
import com.projectsale.enums.RolesEnum;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/** Real Spring Security filter chain; JWT cryptography and persistence are covered separately. */
@WebMvcTest(controllers = AuthController.class, properties = {"spring.config.import=",
    "spring.security.oauth2.client.registration.google.client-id=test-client-id",
    "spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
    "app.oauth2.frontend-base-url=http://localhost:5173"},
    excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitingFilter.class,
    ClientRequestResolver.class,
    RestAuthenticationEntryPoint.class,
    OAuth2LoginSuccessHandler.class, OAuth2LoginFailureHandler.class})
@EnableConfigurationProperties({ProxyProperties.class, OAuth2LoginProperties.class})
class AuthSecurityChainTest {

  private static final String BIND = "b".repeat(43);

  @Autowired
  private MockMvc mvc;

  @MockitoBean
  private AuthService authService;
  @MockitoBean
  private JwtService jwtService;
  @MockitoBean
  private UserRepository userRepository;
  @MockitoBean
  private CustomOidcUserService oidcUserService;
  @MockitoBean
  private OAuth2LoginCodeService oauth2LoginCodeService;

  @Test
  void googleLoginStartRedirectsToGoogleWithPkceNonceAndRemembersTheBind() throws Exception {
    MvcResult result = mvc.perform(get("/oauth2/authorization/google").param("bind", BIND))
        .andExpect(status().isFound())
        .andReturn();

    String location = result.getResponse().getRedirectedUrl();
    assertThat(location).startsWith("https://accounts.google.com/o/oauth2/v2/auth")
        .contains("client_id=test-client-id", "code_challenge=", "code_challenge_method=S256",
            "nonce=", "state=");
    assertThat(result.getRequest().getSession(false).getAttribute(
        BindingAuthorizationRequestResolver.BIND_SESSION_ATTRIBUTE)).isEqualTo(BIND);
  }

  @Test
  void googleLoginStartWithoutValidBindIsRejected() throws Exception {
    mvc.perform(get("/oauth2/authorization/google")).andExpect(status().isUnauthorized());
    mvc.perform(get("/oauth2/authorization/google").param("bind", "short"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void googleCallbackWithoutStartedFlowRedirectsToSsrLoginError() throws Exception {
    mvc.perform(get("/login/oauth2/code/google").param("code", "x").param("state", "y"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("http://localhost:5173/login?oauth_error=oauth_failed"));
  }

  @Test
  void anonymousOAuth2ExchangeReachesService() throws Exception {
    mvc.perform(post("/api/v1/auth/oauth2/exchange").contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"code":"one-time-code","bind":"%s",
                 "deviceId":"%s","deviceName":"QA PC","platform":"WINDOWS"}
                """.formatted(BIND, UUID.randomUUID())))
        .andExpect(status().isOk());
    verify(authService).exchangeOAuth2Code(any(), any());
  }

  @Test
  void anonymousMeRequiresBearerAuthentication() throws Exception {
    mvc.perform(post("/api/v1/auth/me")).andExpect(status().isUnauthorized());
    verifyNoInteractions(authService);
  }

  @Test
  void malformedBearerCannotAccessMe() throws Exception {
    when(jwtService.verifyAccessToken("invalid"))
        .thenThrow(new JwtService.InvalidJwtException());
    mvc.perform(post("/api/v1/auth/me").header("Authorization", "Bearer invalid"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(authService);
  }

  @Test
  void authenticatedMeUsesBearerPrincipalWithoutBodyToken() throws Exception {
    UUID userId = stubAuthenticatedUser(true);
    mvc.perform(post("/api/v1/auth/me").header("Authorization", "Bearer test-access"))
        .andExpect(status().isOk());
    verify(authService).getMe(userId);
  }

  @Test
  void disabledUserWithPreviouslyIssuedTokenCannotAccessMe() throws Exception {
    stubAuthenticatedUser(false);
    mvc.perform(post("/api/v1/auth/me").header("Authorization", "Bearer test-access"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(authService);
  }

  @Test
  void anonymousPendingUserCanRequestReplacementOtp() throws Exception {
    mvc.perform(post("/api/v1/auth/resendOTP").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"pending@example.com\"}"))
        .andExpect(status().isOk());
    verify(authService).resendOTP("pending@example.com");
  }

  @Test
  void anonymousValidLoginReachesService() throws Exception {
    mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"email":"member@example.com","password":"secret123",
                 "deviceId":"%s","deviceName":"QA PC","platform":"WINDOWS"}
                """.formatted(UUID.randomUUID())))
        .andExpect(status().isOk());
    verify(authService).login(any(), any());
  }

  private UUID stubAuthenticatedUser(boolean active) {
    UUID userId = UUID.randomUUID();
    when(jwtService.verifyAccessToken("test-access")).thenReturn(new AccessTokenClaims(
        userId, "USER", UUID.randomUUID(), UUID.randomUUID(), Instant.now().plusSeconds(900)));
    User user = org.mockito.Mockito.mock(User.class);
    when(user.getPublicId()).thenReturn(userId);
    when(user.isActive()).thenReturn(active);
    when(user.getRole()).thenReturn(RolesEnum.USER);
    when(userRepository.findByPublicId(userId)).thenReturn(Optional.of(user));
    return userId;
  }
}
