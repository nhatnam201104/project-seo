package com.projectsale.common.rateLimit;

import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import java.time.Duration;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

/**
 * Bộ đếm fixed-window atomic trong Redis. Đánh đổi đã chấp nhận: ở ranh giới hai
 * cửa sổ có thể lọt tối đa gấp đôi hạn mức.
 */
@Component
@Slf4j
public class RedisRateLimiter {

  private static final long MILLIS_PER_SECOND = 1_000L;

  @SuppressWarnings("rawtypes")
  private static final DefaultRedisScript<List> SCRIPT = script();

  private final StringRedisTemplate redisTemplate;

  public RedisRateLimiter(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  /**
   * Tính request này vào quota của {@code key}. Redis lỗi → fail-closed
   * ({@code REDIS_ERROR}): các endpoint được bảo vệ vốn cũng cần Redis để chạy.
   */
  public Decision tryAcquire(String key, int limit, Duration window) {
    List<?> result;
    try {
      result = redisTemplate.execute(SCRIPT, List.of(key), Long.toString(window.toMillis()));
    } catch (DataAccessException exception) {
      log.error("Rate limiter store unavailable", exception);
      throw new AppException(ErrorCode.REDIS_ERROR);
    }
    long count = ((Number) result.get(0)).longValue();
    if (count <= limit) {
      return new Decision(true, 0);
    }
    long remainingMillis = ((Number) result.get(1)).longValue();
    long retryAfterSeconds = Math.max(1L,
        (remainingMillis + MILLIS_PER_SECOND - 1) / MILLIS_PER_SECOND);
    return new Decision(false, retryAfterSeconds);
  }

  /** {@code retryAfterSeconds} chỉ có nghĩa khi bị từ chối (luôn ≥ 1). */
  public record Decision(boolean allowed, long retryAfterSeconds) {}

  @SuppressWarnings("rawtypes")
  private static DefaultRedisScript<List> script() {
    DefaultRedisScript<List> script = new DefaultRedisScript<>();
    script.setLocation(new ClassPathResource("redis/rate-limit/fixed-window.lua"));
    script.setResultType(List.class);
    return script;
  }
}
