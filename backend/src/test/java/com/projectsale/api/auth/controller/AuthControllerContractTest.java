package com.projectsale.api.auth.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.projectsale.api.auth.service.AuthService;
import com.projectsale.common.exception.ApiExceptionHandler;
import com.projectsale.common.web.ClientRequestResolver;
import com.projectsale.common.web.ProxyProperties;
import com.projectsale.api.auth.security.RefreshTokenService;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import java.util.List;
import java.util.UUID;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AuthControllerContractTest {

  private AuthService authService;
  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    authService = mock(AuthService.class);
    mvc = MockMvcBuilders.standaloneSetup(new AuthController(authService,
            new ClientRequestResolver(new ProxyProperties(""))))
        .setControllerAdvice(new ApiExceptionHandler())
        .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
        .build();
  }

  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void registerRejectsMalformedEmailAndShortPasswordBeforeServiceCall() throws Exception {
    mvc.perform(post("/api/v1/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "not-an-email",
                  "password": "short",
                  "full_name": "QA User",
                  "phone": "0912345678"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.message").value("Dữ liệu không hợp lệ"))
        .andExpect(jsonPath("$.error.detailMessage").value(Matchers.allOf(
            Matchers.containsString("email"), Matchers.containsString("password"))));

    verifyNoInteractions(authService);
  }

  @Test
  void loginRejectsInvalidBodyBeforeServiceCall() throws Exception {
    mvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "not-an-email",
                  "password": "",
                  "deviceId": "%s",
                  "deviceName": "QA PC",
                  "platform": "WINDOWS"
                }
                """.formatted(UUID.randomUUID())))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(authService);
  }

  @Test
  void verifyRejectsOtpWithInvalidLengthBeforeServiceCall() throws Exception {
    mvc.perform(post("/api/v1/auth/verify")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "member@example.com",
                  "otp": "12345",
                  "deviceId": "%s",
                  "deviceName": "QA PC",
                  "platform": "WINDOWS"
                }
                """.formatted(UUID.randomUUID())))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.detailMessage").value(
            Matchers.containsString("otp")));

    verifyNoInteractions(authService);
  }

  @Test
  void refreshRejectsBlankTokenBeforeServiceCall() throws Exception {
    mvc.perform(post("/api/v1/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refresh_token\": \"  \"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.detailMessage").value(
            Matchers.containsString("refreshToken")));

    verifyNoInteractions(authService);
  }

  @Test
  void meUsesAuthenticatedPrincipalInsteadOfTokenFromBody() throws Exception {
    UUID authenticatedUser = UUID.randomUUID();
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(authenticatedUser, null, List.of()));
    mvc.perform(post("/api/v1/auth/me")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"access_token\": \"untrusted-body-token\"}"))
        .andExpect(status().isOk());
    verify(authService).getMe(authenticatedUser);
  }

  @Test
  void logoutRejectsBlankTokenAndMissingDeviceBeforeServiceCall() throws Exception {
    mvc.perform(post("/api/v1/auth/logout")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refresh_token\": \"\"}"))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(authService);
  }

  @Test
  void logoutInvalidRefreshTokenReturnsUnauthorizedInsteadOfServerError() throws Exception {
    doThrow(new RefreshTokenService.InvalidRefreshTokenException())
        .when(authService).logout(org.mockito.ArgumentMatchers.any());
    mvc.perform(post("/api/v1/auth/logout")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refresh_token\":\"invalid-token\",\"deviceId\":\"%s\"}"
                .formatted(UUID.randomUUID())))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.message").value("Invalid or expired refresh token"));
  }

  @Test
  void logoutDuringRedisOutageIsAServerErrorNotAnAuthenticationFailure() throws Exception {
    // A 401 here would make the SSR refresh interceptor destroy a still-valid session.
    doThrow(mock(RefreshTokenService.RefreshTokenStoreException.class))
        .when(authService).logout(org.mockito.ArgumentMatchers.any());
    mvc.perform(post("/api/v1/auth/logout")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refresh_token\":\"some-token\",\"deviceId\":\"%s\"}"
                .formatted(UUID.randomUUID())))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.error.message")
            .value("Error occurred while interacting with Redis"));
  }

  @Test
  void rateLimitedRequestsUseTheStandardEnvelopeAndTheRealRetryAfter() throws Exception {
    doThrow(new com.projectsale.common.exception.RateLimitExceededException(420))
        .when(authService).resendOTP("member@example.com");
    mvc.perform(post("/api/v1/auth/resendOTP")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"member@example.com\"}"))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().string("Retry-After", "420"))
        .andExpect(jsonPath("$.error.message").value("Too many requests"))
        .andExpect(jsonPath("$.data").isEmpty())
        .andExpect(jsonPath("$.pagination").isEmpty());
  }

  @Test
  void malformedJsonReturnsBadRequestInsteadOfServerError() throws Exception {
    mvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON).content("{"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.message").value("Dữ liệu không hợp lệ"));
    verifyNoInteractions(authService);
  }

  @Test
  void loginRejectsMissingDeviceIdBeforeServiceCall() throws Exception {
    mvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"member@example.com\",\"password\":\"secret123\"}"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(authService);
  }

  @Test
  void verifyAcceptsCurrentCamelCaseDeviceFields() throws Exception {
    mvc.perform(post("/api/v1/auth/verify")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"email":"member@example.com","otp":"123456",
                 "deviceId":"%s","deviceName":"QA PC","platform":"WINDOWS"}
                """.formatted(UUID.randomUUID())))
        .andExpect(status().isOk());
    verify(authService).verify(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
  }
}
