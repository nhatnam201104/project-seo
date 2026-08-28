package com.projectsale.api.auth.service;

import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.common.util.Hashing;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

/**
 * Vòng đời OTP xác thực email trong Redis: sinh bằng CSPRNG, chỉ lưu bản băm,
 * giới hạn số lần nhập, và mỗi mã chỉ dùng được đúng một lần.
 *
 * <p>
 * Bản băm chỉ tránh để lộ mã khi đọc Redis/log thông thường; không gian 10^6
 * vẫn dò được nếu Redis bị chiếm quyền. Lớp bảo vệ chính là TTL ngắn và giới
 * hạn số lần thử.
 */
@Service
@Slf4j
public class OtpService {

  static final Duration OTP_TTL = Duration.ofMinutes(5);
  static final int MAX_ATTEMPTS = 5;

  private static final int OTP_BOUND = 1_000_000;
  private static final long ACCEPTED = 1L;
  private static final String CODE_PREFIX = "otp:";
  private static final String ATTEMPTS_PREFIX = "otp:attempts:";
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final DefaultRedisScript<Long> ISSUE_SCRIPT = script("redis/otp/issue.lua");
  private static final DefaultRedisScript<Long> VERIFY_SCRIPT = script("redis/otp/verify.lua");

  private final StringRedisTemplate redisTemplate;

  public OtpService(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  /** Phát mã mới (thay mã cũ, reset bộ đếm) và trả mã gốc để gửi email. */
  public String issue(String email) {
    String otp = String.format("%06d", RANDOM.nextInt(OTP_BOUND));
    try {
      redisTemplate.execute(ISSUE_SCRIPT, keys(email),
          Hashing.sha256Hex(otp), Long.toString(OTP_TTL.toMillis()));
    } catch (DataAccessException exception) {
      log.error("Error occurred while storing verification OTP", exception);
      throw new AppException(ErrorCode.REDIS_ERROR);
    }
    return otp;
  }

  /**
   * Chấp nhận và huỷ mã trong cùng một bước atomic. Ném {@code INVALID_OTP} nếu
   * mã sai, hết hạn, đã được dùng, hoặc đã vượt số lần thử (khi vượt, mã bị huỷ
   * để người dùng phải yêu cầu mã mới).
   */
  public void verify(String email, String otp) {
    Long result;
    try {
      result = redisTemplate.execute(VERIFY_SCRIPT, keys(email),
          Hashing.sha256Hex(otp), Long.toString(OTP_TTL.toMillis()), Integer.toString(MAX_ATTEMPTS));
    } catch (DataAccessException exception) {
      log.error("Error occurred while verifying OTP", exception);
      throw new AppException(ErrorCode.REDIS_ERROR);
    }
    if (result == null || result != ACCEPTED) {
      throw new AppException(ErrorCode.INVALID_OTP);
    }
  }

  private static List<String> keys(String email) {
    String normalized = email.trim().toLowerCase(Locale.ROOT);
    return List.of(CODE_PREFIX + normalized, ATTEMPTS_PREFIX + normalized);
  }

  private static DefaultRedisScript<Long> script(String path) {
    DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    script.setLocation(new ClassPathResource(path));
    script.setResultType(Long.class);
    return script;
  }
}
