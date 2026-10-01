package com.projectsale.api.auth.service;

import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.common.util.Hashing;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Mã trao tay dùng một lần giữa callback OAuth của backend và server SSR: backend
 * không đưa token lên URL mà chỉ đưa mã này; SSR đổi mã (kèm thông tin thiết bị)
 * lấy token qua {@code /auth/oauth2/exchange}.
 *
 * <p>
 * Mã gắn với {@code bind} — nonce do SSR đặt trong cookie của đúng trình duyệt bắt
 * đầu luồng — để kẻ khác không thể gửi mã của mình cho nạn nhân (login CSRF).
 * Redis chỉ lưu bản băm của mã; GETDEL đảm bảo mỗi mã chỉ dùng được một lần.
 */
@Service
@Slf4j
public class OAuth2LoginCodeService {

  static final Duration CODE_TTL = Duration.ofSeconds(60);

  private static final String KEY_PREFIX = "auth:oauth2:code:";
  private static final String SEPARATOR = "|";
  private static final int CODE_BYTES = 32;
  private static final int MAX_CODE_LENGTH = 64;
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

  private final StringRedisTemplate redisTemplate;

  public OAuth2LoginCodeService(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  public record PendingLogin(UUID userId, String bind) {}

  public String issue(UUID userId, String bind) {
    Objects.requireNonNull(userId, "userId is required");
    Objects.requireNonNull(bind, "bind is required");
    byte[] bytes = new byte[CODE_BYTES];
    RANDOM.nextBytes(bytes);
    String code = ENCODER.encodeToString(bytes);
    try {
      redisTemplate.opsForValue().set(key(code), userId + SEPARATOR + bind, CODE_TTL);
    } catch (DataAccessException exception) {
      log.error("Error occurred while storing OAuth2 login code", exception);
      throw new AppException(ErrorCode.REDIS_ERROR);
    }
    return code;
  }

  /** Lấy và huỷ mã trong một bước atomic; rỗng nếu mã sai, hết hạn hoặc đã dùng. */
  public Optional<PendingLogin> consume(String code) {
    if (code == null || code.isBlank() || code.length() > MAX_CODE_LENGTH) {
      return Optional.empty();
    }
    String value;
    try {
      value = redisTemplate.opsForValue().getAndDelete(key(code));
    } catch (DataAccessException exception) {
      log.error("Error occurred while consuming OAuth2 login code", exception);
      throw new AppException(ErrorCode.REDIS_ERROR);
    }
    return value == null ? Optional.empty() : parse(value);
  }

  private static Optional<PendingLogin> parse(String value) {
    int separator = value.indexOf(SEPARATOR);
    if (separator <= 0 || separator == value.length() - 1) {
      return Optional.empty();
    }
    try {
      UUID userId = UUID.fromString(value.substring(0, separator));
      return Optional.of(new PendingLogin(userId, value.substring(separator + 1)));
    } catch (IllegalArgumentException exception) {
      return Optional.empty();
    }
  }

  private static String key(String code) {
    return KEY_PREFIX + Hashing.sha256Hex(code);
  }
}
