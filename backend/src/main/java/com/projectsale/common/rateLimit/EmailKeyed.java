package com.projectsale.common.rateLimit;

import java.util.Locale;

/**
 * Request body mang email của tài khoản bị tác động — cho phép
 * {@code @RateLimit(keyType = EMAIL)} giới hạn theo tài khoản, bất kể IP.
 */
public interface EmailKeyed {

  String email();

  /** Các biến thể hoa/thường, khoảng trắng của cùng một email dùng chung một bucket. */
  default String normalizedEmail() {
    return email().trim().toLowerCase(Locale.ROOT);
  }
}
