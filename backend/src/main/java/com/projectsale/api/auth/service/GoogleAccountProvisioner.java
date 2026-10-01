package com.projectsale.api.auth.service;

import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.entity.User;
import com.projectsale.enums.AuthProvider;
import com.projectsale.enums.StatusEnum;

import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ánh xạ một danh tính Google đã xác minh sang tài khoản nội bộ: tìm theo
 * {@code sub}, nếu chưa có thì liên kết theo email, nếu vẫn chưa có thì đăng ký
 * mới. Lỗi ném ra là {@link OAuth2AuthenticationException} để Spring chuyển cho
 * failure handler; mã lỗi nằm trong whitelist hiển thị cho người dùng.
 */
@Service
@RequiredArgsConstructor
public class GoogleAccountProvisioner {

  public static final String EMAIL_NOT_VERIFIED = "email_not_verified";
  public static final String ACCOUNT_DISABLED = "account_disabled";
  public static final String ACCOUNT_CONFLICT = "account_conflict";

  private static final int FULL_NAME_MAX_LENGTH = 120;

  private final UserRepository userRepository;

  /** Thông tin cần thiết lấy từ ID token Google (đã được Spring xác minh chữ ký). */
  public record GoogleProfile(String sub, String email, boolean emailVerified, String fullName) {}

  @Transactional
  public User provision(GoogleProfile profile) {
    // Chỉ email đã xác minh mới chứng minh được quyền sở hữu để liên kết tài khoản.
    if (!profile.emailVerified() || profile.email() == null) {
      throw oauthError(EMAIL_NOT_VERIFIED);
    }
    Optional<User> linked = userRepository
        .findByProviderAndProviderId(AuthProvider.GOOGLE, profile.sub());
    User user = linked.isPresent()
        ? linked.get()
        : userRepository.findByEmail(profile.email())
            .map(existing -> link(existing, profile.sub()))
            .orElseGet(() -> register(profile));
    if (user.getStatus() == StatusEnum.UNACTIVE) {
      throw oauthError(ACCOUNT_DISABLED);
    }
    if (isBlank(user.getFullName()) && !isBlank(profile.fullName())) {
      user.setFullName(truncate(profile.fullName()));
    }
    return userRepository.save(user);
  }

  private User link(User user, String sub) {
    if (user.getStatus() == StatusEnum.UNACTIVE) {
      throw oauthError(ACCOUNT_DISABLED);
    }
    // Không tìm thấy theo sub mà tài khoản đã gắn Google → là một tài khoản Google khác.
    if (user.getProvider() == AuthProvider.GOOGLE && user.getProviderId() != null) {
      throw oauthError(ACCOUNT_CONFLICT);
    }
    if (user.getStatus() == StatusEnum.PENDING) {
      // Mật khẩu của tài khoản chờ xác thực chưa từng được chủ email chứng minh: có thể
      // do kẻ khác đăng ký trước bằng email này (pre-account-takeover) → huỷ.
      user.setPasswordHash(null);
      user.setStatus(StatusEnum.ACTIVE);
    }
    user.setProvider(AuthProvider.GOOGLE);
    user.setProviderId(sub);
    return user;
  }

  private static User register(GoogleProfile profile) {
    User user = new User();
    user.setEmail(profile.email());
    user.setProvider(AuthProvider.GOOGLE);
    user.setProviderId(profile.sub());
    user.setStatus(StatusEnum.ACTIVE);
    return user;
  }

  private static OAuth2AuthenticationException oauthError(String errorCode) {
    return new OAuth2AuthenticationException(new OAuth2Error(errorCode), errorCode);
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private static String truncate(String value) {
    String trimmed = value.trim();
    return trimmed.length() <= FULL_NAME_MAX_LENGTH
        ? trimmed
        : trimmed.substring(0, FULL_NAME_MAX_LENGTH);
  }
}
