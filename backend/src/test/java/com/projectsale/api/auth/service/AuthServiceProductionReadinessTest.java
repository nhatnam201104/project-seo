package com.projectsale.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.projectsale.api.auth.dto.AuthRequest.LoginRequest;
import com.projectsale.api.auth.dto.AuthRequest.LogoutRequest;
import com.projectsale.api.auth.dto.AuthRequest.RegisterRequest;
import com.projectsale.api.auth.dto.AuthRequest.RefreshRequest;
import com.projectsale.api.auth.dto.AuthRequest.VerifyRequest;
import com.projectsale.api.auth.dto.AuthResponse.TokenResponse;
import com.projectsale.api.auth.dto.AuthResponse.UserResponse;
import com.projectsale.api.auth.mapper.UserMapper;
import com.projectsale.api.auth.security.JwtService;
import com.projectsale.api.auth.security.RefreshTokenService;
import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.auth.security.dto.DeviceActivity;
import com.projectsale.api.auth.security.dto.RefreshTokenClaims;
import com.projectsale.api.auth.security.dto.DevicePlatform;
import com.projectsale.api.auth.security.dto.IssuedRefreshToken;
import com.projectsale.api.auth.security.dto.VerifiedRefreshToken;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.common.mail.EmailService;
import com.projectsale.entity.User;
import com.projectsale.enums.RolesEnum;
import com.projectsale.enums.StatusEnum;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceProductionReadinessTest {

  private UserRepository userRepository;
  private UserMapper mapper;
  private PasswordEncoder passwordEncoder;
  private EmailService emailService;
  private JwtService jwtService;
  private OtpService otpService;
  private RefreshTokenService refreshTokenService;
  private AuthService service;

  @BeforeEach
  void setUp() {
    userRepository = mock(UserRepository.class);
    mapper = mock(UserMapper.class);
    passwordEncoder = mock(PasswordEncoder.class);
    emailService = mock(EmailService.class);
    jwtService = mock(JwtService.class);
    otpService = mock(OtpService.class);
    refreshTokenService = mock(RefreshTokenService.class);
    service = new AuthService(userRepository, mapper, passwordEncoder, emailService,
        jwtService, otpService, refreshTokenService);
    // The constructor pre-computes a dummy BCrypt hash; tests assert only on request-time calls.
    clearInvocations(passwordEncoder);
  }

  @Test
  void registerHashesPasswordPersistsPendingUserAndSendsStoredOtp() {
    RegisterRequest request = new RegisterRequest(
        "new@example.com", "secret123", "New User", "0912345678");
    User user = mock(User.class);
    when(mapper.toUserEntity(request)).thenReturn(user);
    when(passwordEncoder.encode("secret123")).thenReturn("bcrypt-hash");
    when(otpService.issue("new@example.com")).thenReturn("654321");

    service.register(request);

    verify(user).setPasswordHash("bcrypt-hash");
    verify(user).setStatus(StatusEnum.PENDING);
    verify(userRepository).save(user);
    verify(emailService).sendVerificationEmail("new@example.com", "654321");
  }

  @Test
  void registerRejectsEmailOfDisabledAccountInsteadOfViolatingUniqueKey() {
    User disabled = activeUser();
    when(disabled.getStatus()).thenReturn(StatusEnum.UNACTIVE);
    when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.of(disabled));

    assertAppError(() -> service.register(new RegisterRequest(
        "new@example.com", "secret123", "New User", "0912345678")),
        ErrorCode.ACCOUNT_DISABLED);

    verify(userRepository, never()).save(any());
    verifyNoInteractions(otpService, emailService);
  }

  @Test
  void registerRejectsDuplicatePhoneBeforeCreatingUser() {
    when(userRepository.existsByPhone("0912345678")).thenReturn(true);

    assertAppError(() -> service.register(new RegisterRequest(
        "new@example.com", "secret123", "New User", "0912345678")),
        ErrorCode.PHONE_ALREADY_EXIST);

    verifyNoInteractions(mapper, passwordEncoder, emailService, refreshTokenService);
    verify(userRepository, never()).save(any());
  }

  @Test
  void registerMapsRedisFailureAndDoesNotSendOtpEmail() {
    RegisterRequest request = new RegisterRequest(
        "new@example.com", "secret123", "New User", "0912345678");
    when(mapper.toUserEntity(request)).thenReturn(mock(User.class));
    when(passwordEncoder.encode("secret123")).thenReturn("bcrypt-hash");
    when(otpService.issue("new@example.com")).thenThrow(new AppException(ErrorCode.REDIS_ERROR));

    assertAppError(() -> service.register(request), ErrorCode.REDIS_ERROR);

    verifyNoInteractions(emailService);
  }

  @Test
  void loginRejectsWrongPasswordWithoutIssuingTokens() {
    User user = activeUser();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    when(passwordEncoder.matches("wrong-password", user.getPasswordHash())).thenReturn(false);

    assertAppError(() -> service.login(loginRequest("wrong-password"), device()),
        ErrorCode.INVALID_CREDENTIALS);

    verifyNoInteractions(refreshTokenService, jwtService, mapper);
  }

  @Test
  void loginIssuesBothTokensForCorrectCredentials() {
    User user = activeUser();
    UUID sessionId = UUID.randomUUID();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    when(passwordEncoder.matches("secret123", user.getPasswordHash())).thenReturn(true);
    when(refreshTokenService.issue(user, device())).thenReturn(new IssuedRefreshToken(
        "refresh-token", sessionId, UUID.randomUUID(), device().deviceId(),
        Instant.now().plusSeconds(3600)));
    when(jwtService.issueAccessToken(user, sessionId)).thenReturn("access-token");
    UserResponse mappedUser = userResponse(user);
    when(mapper.toResponse(user)).thenReturn(mappedUser);

    TokenResponse response = service.login(loginRequest("secret123"), device());

    assertThat(response.accessToken()).isEqualTo("access-token");
    assertThat(response.refreshToken()).isEqualTo("refresh-token");
    verify(jwtService).issueAccessToken(user, sessionId);
  }

  @Test
  void verifyRejectsWrongOtpWithoutActivatingUserOrIssuingTokens() {
    User user = pendingUser();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    doThrow(new AppException(ErrorCode.INVALID_OTP))
        .when(otpService).verify("member@example.com", "654321");

    assertAppError(() -> service.verify(
        new VerifyRequest("member@example.com", "654321", device().deviceId(),
            "QA PC", DevicePlatform.WINDOWS), device()), ErrorCode.INVALID_OTP);

    verify(user, never()).setStatus(StatusEnum.ACTIVE);
    verify(userRepository, never()).save(any());
    verifyNoInteractions(refreshTokenService, jwtService, mapper);
  }

  @Test
  void logoutRevokesOnlyWhenRefreshTokenBelongsToRequestedDevice() {
    UUID deviceId = UUID.randomUUID();
    when(refreshTokenService.verify("refresh-token")).thenReturn(new VerifiedRefreshToken(
        UUID.randomUUID(), UUID.randomUUID(), deviceId, UUID.randomUUID(),
        Instant.now().plusSeconds(3600)));

    service.logout(new LogoutRequest("refresh-token", deviceId));

    verify(refreshTokenService).revoke("refresh-token");
  }

  @Test
  void logoutRejectsMismatchedDeviceWithoutRevokingSession() {
    when(refreshTokenService.verify("refresh-token")).thenReturn(new VerifiedRefreshToken(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        Instant.now().plusSeconds(3600)));

    assertAppError(
        () -> service.logout(new LogoutRequest("refresh-token", UUID.randomUUID())),
        ErrorCode.DEVICE_NOT_LOGIN);

    verify(refreshTokenService, never()).revoke(any());
  }

  @Test
  void loginMissingAccountUsesSameErrorAsWrongPassword() {
    assertAppError(() -> service.login(loginRequest("wrong-password"), device()),
        ErrorCode.INVALID_CREDENTIALS);
    verifyNoInteractions(refreshTokenService, jwtService);
  }

  @Test
  void loginMissingAccountStillPaysForAPasswordCheckToHideTimingDifferences() {
    assertAppError(() -> service.login(loginRequest("secret123"), device()),
        ErrorCode.INVALID_CREDENTIALS);
    verify(passwordEncoder).matches(org.mockito.ArgumentMatchers.eq("secret123"), any());
  }

  @Test
  void loginPendingAccountWithCorrectPasswordIsSentToVerificationWithoutTokens() {
    User user = pendingUser();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    when(passwordEncoder.matches("secret123", user.getPasswordHash())).thenReturn(true);
    assertAppError(() -> service.login(loginRequest("secret123"), device()),
        ErrorCode.ACCOUNT_NOT_VERIFY);
    verifyNoInteractions(refreshTokenService, jwtService);
  }

  @Test
  void loginPendingAccountWithWrongPasswordDoesNotRevealVerificationState() {
    User user = pendingUser();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    when(passwordEncoder.matches("wrong-password", user.getPasswordHash())).thenReturn(false);
    assertAppError(() -> service.login(loginRequest("wrong-password"), device()),
        ErrorCode.INVALID_CREDENTIALS);
    verifyNoInteractions(refreshTokenService, jwtService);
  }

  @Test
  void loginDisabledAccountLooksLikeWrongCredentialsEvenWithCorrectPassword() {
    User user = activeUser();
    when(user.getStatus()).thenReturn(StatusEnum.UNACTIVE);
    when(user.isActive()).thenReturn(false);
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    when(passwordEncoder.matches("secret123", user.getPasswordHash())).thenReturn(true);
    assertAppError(() -> service.login(loginRequest("secret123"), device()),
        ErrorCode.INVALID_CREDENTIALS);
    verifyNoInteractions(refreshTokenService, jwtService);
  }

  @Test
  void verifyExpiredOtpDoesNotActivateAccount() {
    User user = pendingUser();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    doThrow(new AppException(ErrorCode.INVALID_OTP))
        .when(otpService).verify("member@example.com", "123456");
    assertAppError(() -> service.verify(new VerifyRequest("member@example.com", "123456",
        device().deviceId(), "QA PC", DevicePlatform.WINDOWS), device()), ErrorCode.INVALID_OTP);
    verify(userRepository, never()).save(any());
    verifyNoInteractions(refreshTokenService, jwtService);
  }

  @Test
  void verifyMustNotReactivateDisabledAccountWithOutstandingOtp() {
    User user = activeUser();
    when(user.getStatus()).thenReturn(StatusEnum.UNACTIVE);
    when(user.isActive()).thenReturn(false);
    when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));
    // The OTP mock accepts the code. Keep downstream dependencies viable so a missing status
    // guard is a security failure, not a mock NullPointerException that would disguise it.
    when(refreshTokenService.issue(user, device())).thenReturn(new IssuedRefreshToken(
        "refresh-token", UUID.randomUUID(), UUID.randomUUID(), device().deviceId(),
        Instant.now().plusSeconds(3600)));
    assertAppError(() -> service.verify(new VerifyRequest("member@example.com", "123456",
        device().deviceId(), "QA PC", DevicePlatform.WINDOWS), device()),
        ErrorCode.ACCOUNT_DISABLED);
    verify(user, never()).setStatus(StatusEnum.ACTIVE);
    verify(userRepository, never()).save(any());
    verifyNoInteractions(refreshTokenService, jwtService);
  }

  @Test
  void verifyRejectsAlreadyActiveAccountWithoutIssuingNewSession() {
    User user = activeUser();
    when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));
    assertAppError(() -> service.verify(new VerifyRequest("member@example.com", "123456",
        device().deviceId(), "QA PC", DevicePlatform.WINDOWS), device()),
        ErrorCode.ACCOUNT_ALREADY_VERIFIED);
    verify(userRepository, never()).save(any());
    verifyNoInteractions(refreshTokenService, jwtService);
  }

  @Test
  void verifyChecksTheOtpBeforeRevealingAccountState() {
    User user = activeUser();
    when(user.getStatus()).thenReturn(StatusEnum.UNACTIVE);
    when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));
    doThrow(new AppException(ErrorCode.INVALID_OTP))
        .when(otpService).verify("member@example.com", "000000");
    assertAppError(() -> service.verify(new VerifyRequest("member@example.com", "000000",
        device().deviceId(), "QA PC", DevicePlatform.WINDOWS), device()),
        ErrorCode.INVALID_OTP);
  }

  @Test
  void resendOtpForPendingUserStoresFreshCodeAndSendsEmail() {
    User user = pendingUser();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    when(otpService.issue("member@example.com")).thenReturn("654321");
    service.resendOTP("member@example.com");
    verify(emailService).sendVerificationEmail("member@example.com", "654321");
  }

  @Test
  void resendOtpRejectsAlreadyActiveAccount() {
    User user = activeUser();
    when(userRepository.findByEmail("member@example.com"))
        .thenReturn(Optional.of(user));
    assertAppError(() -> service.resendOTP("member@example.com"), ErrorCode.ACCOUNT_ALREADY_VERIFIED);
    verifyNoInteractions(otpService, emailService);
  }

  @Test
  void refreshMapsRevokedTokenToAuthenticationError() {
    when(refreshTokenService.rotate(any(), any()))
        .thenThrow(new RefreshTokenService.RevokedRefreshTokenException());
    assertAppError(() -> service.refresh(new RefreshRequest("revoked-token"),
        new DeviceActivity("test-agent", "127.0.0.1")), ErrorCode.INVALID_REFRESH_TOKEN);
    verifyNoInteractions(jwtService);
  }

  @Test
  void refreshRefusesDisabledAccountAfterRotation() {
    UUID userId = UUID.randomUUID();
    UUID sessionId = UUID.randomUUID();
    UUID tokenId = UUID.randomUUID();
    Instant expiry = Instant.now().plusSeconds(3600);
    when(refreshTokenService.rotate(any(), any())).thenReturn(new IssuedRefreshToken(
        "rotated-token", sessionId, tokenId, device().deviceId(), expiry));
    when(jwtService.verifyRefreshToken("rotated-token"))
        .thenReturn(new RefreshTokenClaims(userId, sessionId, tokenId, expiry));
    User user = pendingUser();
    when(userRepository.findByPublicId(userId)).thenReturn(Optional.of(user));
    assertAppError(() -> service.refresh(new RefreshRequest("old-token"),
        new DeviceActivity("test-agent", "127.0.0.1")), ErrorCode.INVALID_REFRESH_TOKEN);
    verify(jwtService, never()).issueAccessToken(any(), any());
  }

  private static LoginRequest loginRequest(String password) {
    return new LoginRequest("member@example.com", device().deviceId(),
        "QA PC", DevicePlatform.WINDOWS, password);
  }

  private static DeviceInfo device() {
    return new DeviceInfo(UUID.fromString("11111111-1111-1111-1111-111111111111"),
        "QA PC", DevicePlatform.WINDOWS, "test-agent", "127.0.0.1");
  }

  private static User activeUser() {
    User user = mock(User.class);
    when(user.getPublicId()).thenReturn(UUID.randomUUID());
    when(user.getEmail()).thenReturn("member@example.com");
    when(user.getPasswordHash()).thenReturn("bcrypt-hash");
    when(user.getRole()).thenReturn(RolesEnum.USER);
    when(user.getStatus()).thenReturn(StatusEnum.ACTIVE);
    when(user.isActive()).thenReturn(true);
    return user;
  }

  private static User pendingUser() {
    User user = activeUser();
    when(user.getStatus()).thenReturn(StatusEnum.PENDING);
    when(user.isActive()).thenReturn(false);
    return user;
  }

  private static UserResponse userResponse(User user) {
    return new UserResponse(user.getPublicId(), user.getEmail(),
        "Member", "0912345678", user.getRole());
  }

  private static void assertAppError(org.assertj.core.api.ThrowableAssert.ThrowingCallable call,
      ErrorCode errorCode) {
    assertThatThrownBy(call).isInstanceOfSatisfying(AppException.class,
        exception -> assertThat(exception.errorCode()).isEqualTo(errorCode));
  }
}
