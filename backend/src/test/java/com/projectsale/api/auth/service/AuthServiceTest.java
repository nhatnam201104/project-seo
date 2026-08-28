package com.projectsale.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.projectsale.api.auth.dto.AuthRequest.RefreshRequest;
import com.projectsale.api.auth.dto.AuthRequest.VerifyRequest;
import com.projectsale.api.auth.dto.AuthResponse.TokenPair;
import com.projectsale.api.auth.dto.AuthResponse.TokenResponse;
import com.projectsale.api.auth.dto.AuthResponse.UserResponse;
import com.projectsale.api.auth.mapper.UserMapper;
import com.projectsale.api.auth.security.JwtService;
import com.projectsale.api.auth.security.RefreshTokenService;
import com.projectsale.api.auth.security.dto.DeviceActivity;
import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.auth.security.dto.DevicePlatform;
import com.projectsale.api.auth.security.dto.IssuedRefreshToken;
import com.projectsale.api.auth.security.dto.RefreshTokenClaims;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.mail.EmailService;
import com.projectsale.entity.User;
import com.projectsale.enums.RolesEnum;
import com.projectsale.enums.StatusEnum;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

  @Test
  void verifyIssuesAccessAndRefreshTokensWithTheSameSessionId() {
    UUID userId = UUID.randomUUID();
    UUID sessionId = UUID.randomUUID();
    UUID deviceId = UUID.randomUUID();
    User user = mock(User.class);
    when(user.getPublicId()).thenReturn(userId);
    when(user.getRole()).thenReturn(RolesEnum.USER);
    when(user.getStatus()).thenReturn(StatusEnum.PENDING);
    when(user.isActive()).thenReturn(true);

    UserRepository userRepository = mock(UserRepository.class);
    when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.of(user));
    JwtService jwtService = mock(JwtService.class);
    when(jwtService.issueAccessToken(user, sessionId)).thenReturn("access-token");
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    when(refreshTokenService.issue(any(), any())).thenReturn(new IssuedRefreshToken(
        "refresh-token",
        sessionId,
        UUID.randomUUID(),
        deviceId,
        Instant.now().plusSeconds(3600)));
    OtpService otpService = mock(OtpService.class);
    UserMapper mapper = mock(UserMapper.class);
    UserResponse userResponse = new UserResponse(
        userId, "new@example.com", "New User", "0912345678", RolesEnum.USER);
    when(mapper.toResponse(user)).thenReturn(userResponse);
    AuthService service = new AuthService(
        userRepository,
        mapper,
        mock(PasswordEncoder.class),
        mock(EmailService.class),
        jwtService,
        otpService,
        refreshTokenService);
    DeviceInfo device = new DeviceInfo(
        deviceId, "Office PC", DevicePlatform.WINDOWS, "test-agent", "127.0.0.1");

    TokenResponse response = service.verify(
        new VerifyRequest("new@example.com", "123456", deviceId, "Office PC", DevicePlatform.WINDOWS),
        device);

    assertThat(response.accessToken()).isEqualTo("access-token");
    assertThat(response.refreshToken()).isEqualTo("refresh-token");
    verify(refreshTokenService).issue(user, device);
    verify(jwtService).issueAccessToken(user, sessionId);
    verify(user).setStatus(StatusEnum.ACTIVE);
    verify(otpService).verify("new@example.com", "123456");
  }

  @Test
  void refreshIssuesAccessTokenWithRotatedRefreshSessionId() {
    UUID userId = UUID.randomUUID();
    UUID sessionId = UUID.randomUUID();
    UUID tokenId = UUID.randomUUID();
    User user = mock(User.class);
    when(user.getPublicId()).thenReturn(userId);
    when(user.getRole()).thenReturn(RolesEnum.USER);
    when(user.isActive()).thenReturn(true);

    UserRepository userRepository = mock(UserRepository.class);
    when(userRepository.findByPublicId(userId)).thenReturn(Optional.of(user));
    JwtService jwtService = mock(JwtService.class);
    when(jwtService.verifyRefreshToken("new-refresh"))
        .thenReturn(new RefreshTokenClaims(
            userId, sessionId, tokenId, Instant.now().plusSeconds(3600)));
    when(jwtService.issueAccessToken(user, sessionId)).thenReturn("new-access");
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    when(refreshTokenService.rotate(any(), any())).thenReturn(new IssuedRefreshToken(
        "new-refresh",
        sessionId,
        tokenId,
        UUID.randomUUID(),
        Instant.now().plusSeconds(3600)));

    AuthService service = new AuthService(
        userRepository,
        mock(UserMapper.class),
        mock(PasswordEncoder.class),
        mock(EmailService.class),
        jwtService,
        mock(OtpService.class),
        refreshTokenService);

    TokenPair pair = service.refresh(
        new RefreshRequest("old-refresh"),
        new DeviceActivity("test-agent", "127.0.0.1"));

    assertThat(pair.accessToken()).isEqualTo("new-access");
    assertThat(pair.refreshToken()).isEqualTo("new-refresh");
    verify(jwtService).issueAccessToken(user, sessionId);
  }
}
