package com.projectsale.api.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.projectsale.api.auth.dto.AuthRequest.LoginRequest;
import com.projectsale.api.auth.dto.AuthRequest.RefreshRequest;
import com.projectsale.api.auth.dto.AuthRequest.RegisterRequest;
import com.projectsale.api.auth.dto.AuthRequest.VerifyRequest;
import com.projectsale.api.auth.dto.AuthResponse.TokenPair;
import com.projectsale.api.auth.dto.AuthResponse.TokenResponse;
import com.projectsale.api.auth.dto.AuthResponse.UserResponse;
import com.projectsale.api.auth.security.dto.DeviceActivity;
import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.auth.service.AuthService;
import com.projectsale.common.exception.ApiExceptionHandler;
import com.projectsale.common.web.ClientRequestResolver;
import com.projectsale.common.web.ProxyProperties;
import com.projectsale.enums.RolesEnum;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AuthControllerTest {

  private static final String PROXY_SECRET = "p".repeat(48);

  private AuthService authService;
  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    authService = mock(AuthService.class);
    ClientRequestResolver resolver = new ClientRequestResolver(new ProxyProperties(PROXY_SECRET));
    mvc = MockMvcBuilders.standaloneSetup(new AuthController(authService, resolver))
        .setControllerAdvice(new ApiExceptionHandler())
        .build();
  }

  @Test
  void registerCreatesPendingAccountWithoutLoggingOrReturningTokens() throws Exception {
    mvc.perform(post("/api/v1/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "new@example.com",
                  "password": "secret123",
                  "full_name": "New User",
                  "phone": "0912345678"
                }
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.error").isEmpty())
        .andExpect(jsonPath("$.data").isEmpty());

    verify(authService).register(any(RegisterRequest.class));
  }

  @Test
  void verifyBuildsDeviceInfoFromBodyAndHttpRequest() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID deviceId = UUID.randomUUID();
    TokenResponse response = new TokenResponse(
        "access-token",
        "refresh-token",
        new UserResponse(userId, "new@example.com", "New User", "0912345678", RolesEnum.USER));
    when(authService.verify(any(VerifyRequest.class), any(DeviceInfo.class))).thenReturn(response);

    mvc.perform(post("/api/v1/auth/verify")
            .with(request -> {
              request.setRemoteAddr("203.0.113.10");
              return request;
            })
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0) Chrome/140.0")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "new@example.com",
                  "otp": "123456",
                  "deviceId": "%s",
                  "deviceName": "Office PC",
                  "platform": "WINDOWS"
                }
                """.formatted(deviceId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.access_token").value("access-token"))
        .andExpect(jsonPath("$.data.refresh_token").value("refresh-token"));

    ArgumentCaptor<DeviceInfo> deviceCaptor = ArgumentCaptor.forClass(DeviceInfo.class);
    verify(authService).verify(any(VerifyRequest.class), deviceCaptor.capture());
    DeviceInfo device = deviceCaptor.getValue();
    assertThat(device.deviceId()).isEqualTo(deviceId);
    assertThat(device.displayName()).isEqualTo("Office PC");
    assertThat(device.userAgent()).contains("Windows NT 10.0");
    assertThat(device.ipAddress()).isEqualTo("203.0.113.10");
  }

  @Test
  void refreshBuildsDeviceActivityAndReturnsRotatedTokenPair() throws Exception {
    when(authService.refresh(any(RefreshRequest.class), any(DeviceActivity.class)))
        .thenReturn(new TokenPair("new-access", "new-refresh"));

    mvc.perform(post("/api/v1/auth/refresh")
            .with(request -> {
              request.setRemoteAddr("198.51.100.20");
              return request;
            })
            .header("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"refresh_token": "old-refresh"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.access_token").value("new-access"))
        .andExpect(jsonPath("$.data.refresh_token").value("new-refresh"));

    ArgumentCaptor<DeviceActivity> activityCaptor = ArgumentCaptor.forClass(DeviceActivity.class);
    verify(authService).refresh(any(RefreshRequest.class), activityCaptor.capture());
    assertThat(activityCaptor.getValue().userAgent()).contains("iPhone OS 18_0");
    assertThat(activityCaptor.getValue().ipAddress()).isEqualTo("198.51.100.20");
  }

  @Test
  void loginThroughTheTrustedSsrServerRecordsTheBrowserNotTheServer() throws Exception {
    mvc.perform(post("/api/v1/auth/login")
            .with(request -> {
              request.setRemoteAddr("10.0.0.5");
              return request;
            })
            .header("User-Agent", "axios/1.12.2")
            .header(ClientRequestResolver.PROXY_SECRET, PROXY_SECRET)
            .header(ClientRequestResolver.FORWARDED_FOR, "203.0.113.77")
            .header(ClientRequestResolver.FORWARDED_USER_AGENT,
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "member@example.com",
                  "password": "secret123",
                  "deviceId": "%s"
                }
                """.formatted(UUID.randomUUID())))
        .andExpect(status().isOk());

    ArgumentCaptor<DeviceInfo> deviceCaptor = ArgumentCaptor.forClass(DeviceInfo.class);
    verify(authService).login(any(LoginRequest.class), deviceCaptor.capture());
    assertThat(deviceCaptor.getValue().ipAddress()).isEqualTo("203.0.113.77");
    assertThat(deviceCaptor.getValue().userAgent()).contains("Macintosh");
  }
}
