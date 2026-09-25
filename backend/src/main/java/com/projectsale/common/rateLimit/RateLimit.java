package com.projectsale.common.rateLimit;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.temporal.ChronoUnit;

/**
 * Giới hạn số lần gọi một endpoint trong một cửa sổ thời gian, lưu trong Redis
 * nên dùng chung giữa các instance. Có thể lặp lại để áp nhiều quy tắc (vd: theo
 * IP và theo email) — request phải qua được tất cả.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Repeatable(RateLimits.class)
public @interface RateLimit {

  /** Số request tối đa trong một cửa sổ. */
  int limit();

  /** Độ dài cửa sổ, tính theo {@link #unit()}. */
  int duration();

  ChronoUnit unit() default ChronoUnit.MINUTES;

  KeyType keyType();

  /**
   * Chỉ gồm các khoá server tự xác định được. Không có khoá lấy thẳng từ header
   * do client tự đặt — client có thể đổi header để nhận quota mới.
   */
  enum KeyType {
    /** IP của người dùng cuối, đã resolve qua SSR tin cậy ({@code ClientRequestResolver}). */
    IP_ADDRESS,
    /** Email trong request body; tham số phải implement {@link EmailKeyed}. */
    EMAIL
  }
}
