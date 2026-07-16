package com.projectsale.api.auth.service;

import static com.projectsale.api.auth.dto.AuthDtos.LoginRequest;
import static com.projectsale.api.auth.dto.AuthDtos.LogoutRequest;
import static com.projectsale.api.auth.dto.AuthDtos.RefreshRequest;
import static com.projectsale.api.auth.dto.AuthDtos.RefreshResponse;
import static com.projectsale.api.auth.dto.AuthDtos.RegisterRequest;
import static com.projectsale.api.auth.dto.AuthDtos.TokenResponse;
import static com.projectsale.api.auth.dto.AuthDtos.UserResponse;

import com.projectsale.api.auth.entity.RefreshToken;
import com.projectsale.api.auth.mapper.UserMapper;
import com.projectsale.api.auth.repository.RefreshTokenRepository;
import com.projectsale.api.auth.security.JwtProperties;
import com.projectsale.api.auth.security.JwtService;
import com.projectsale.api.common.exception.AppException;
import com.projectsale.api.user.entity.User;
import com.projectsale.api.user.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Xử lý đăng ký / đăng nhập / làm mới token / đăng xuất theo mô hình refresh-token
 * rotation có phát hiện tái sử dụng (revoke cả family khi token bị dùng lại).
 */
@Service
@Transactional(readOnly = true)
public class AuthService {

  private static final int REFRESH_TOKEN_BYTES = 32;

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final JwtProperties jwtProperties;
  private final UserMapper userMapper;
  private final SecureRandom secureRandom = new SecureRandom();

  public AuthService(
      UserRepository userRepository,
      RefreshTokenRepository refreshTokenRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      JwtProperties jwtProperties,
      UserMapper userMapper) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.jwtProperties = jwtProperties;
    this.userMapper = userMapper;
  }

  @Transactional
  public TokenResponse register(RegisterRequest request) {
    String email = request.email().trim().toLowerCase(Locale.ROOT);
    if (userRepository.existsByEmailIgnoreCase(email)) {
      throw AppException.conflict("Email đã tồn tại");
    }
    User user =
        userRepository.saveAndFlush(
            new User(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                request.phone()));
    return issueSession(user);
  }

  @Transactional
  public TokenResponse login(LoginRequest request) {
    User user =
        userRepository
            .findByEmailIgnoreCase(request.email().trim())
            .filter(User::isActive)
            .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
            .orElseThrow(() -> AppException.unauthorized("Email hoặc mật khẩu không đúng"));
    return issueSession(user);
  }

  @Transactional
  public RefreshResponse refresh(RefreshRequest request) {
    Instant now = Instant.now();
    RefreshToken currentToken =
        refreshTokenRepository
            .findForUpdate(hash(request.refreshToken()))
            .orElseThrow(() -> AppException.unauthorized("Refresh token không hợp lệ"));

    if (!currentToken.usableAt(now) || !currentToken.getUser().isActive()) {
      refreshTokenRepository.revokeFamily(currentToken.getTokenFamilyId(), now);
      throw AppException.unauthorized("Refresh token không hợp lệ");
    }

    RawToken nextToken = generateRawToken();
    RefreshToken replacement =
        refreshTokenRepository.save(
            new RefreshToken(
                currentToken.getUser(),
                hash(nextToken.value()),
                currentToken.getTokenFamilyId(),
                now.plus(jwtProperties.refreshTtl())));
    currentToken.rotateTo(replacement, now);
    refreshTokenRepository.save(currentToken);
    return new RefreshResponse(jwtService.issue(currentToken.getUser()), nextToken.value());
  }

  @Transactional
  public void logout(UUID userId, LogoutRequest request) {
    Instant now = Instant.now();
    RefreshToken token =
        refreshTokenRepository
            .findForUpdate(hash(request.refreshToken()))
            .orElseThrow(() -> AppException.unauthorized("Refresh token không hợp lệ"));
    if (!token.getUser().getPublicId().equals(userId)) {
      throw AppException.unauthorized("Refresh token không hợp lệ");
    }
    refreshTokenRepository.revokeFamily(token.getTokenFamilyId(), now);
  }

  public UserResponse me(UUID userId) {
    return userRepository
        .findByPublicId(userId)
        .filter(User::isActive)
        .map(userMapper::toResponse)
        .orElseThrow(() -> AppException.unauthorized("Người dùng không hợp lệ"));
  }

  private TokenResponse issueSession(User user) {
    RawToken rawToken = generateRawToken();
    refreshTokenRepository.save(
        new RefreshToken(
            user, hash(rawToken.value()), UUID.randomUUID(), Instant.now().plus(jwtProperties.refreshTtl())));
    return new TokenResponse(jwtService.issue(user), rawToken.value(), userMapper.toResponse(user));
  }

  private RawToken generateRawToken() {
    byte[] bytes = new byte[REFRESH_TOKEN_BYTES];
    secureRandom.nextBytes(bytes);
    return new RawToken(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
  }

  private String hash(String rawToken) {
    try {
      byte[] digest =
          MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  private record RawToken(String value) {}
}
