package com.projectsale.api.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.projectsale.api.auth.security.JwtAuthenticationFilter;
import com.projectsale.api.auth.security.JwtService;
import com.projectsale.api.auth.security.RateLimitingFilter;
import com.projectsale.api.auth.security.dto.AccessTokenClaims;
import com.projectsale.api.auth.service.AuthService;
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

/** Real Spring Security filter chain; JWT cryptography and persistence are covered separately. */
@WebMvcTest(controllers = AuthController.class, properties = "spring.config.import=",
    excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitingFilter.class,
    ClientRequestResolver.class,
    RestAuthenticationEntryPoint.class})
@EnableConfigurationProperties(ProxyProperties.class)
class AuthSecurityChainTest {

  @Autowired
  private MockMvc mvc;

  @MockitoBean
  private AuthService authService;
  @MockitoBean
  private JwtService jwtService;
  @MockitoBean
  private UserRepository userRepository;

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
