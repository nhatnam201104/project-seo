package com.projectsale.common.exception;

/** Vượt quota của một {@code @RateLimit}; mang thời gian chờ để trả về header Retry-After. */
public class RateLimitExceededException extends RuntimeException {

  private final long retryAfterSeconds;

  public RateLimitExceededException(long retryAfterSeconds) {
    super("Rate limit exceeded, retry after " + retryAfterSeconds + "s");
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public long retryAfterSeconds() {
    return retryAfterSeconds;
  }
}
