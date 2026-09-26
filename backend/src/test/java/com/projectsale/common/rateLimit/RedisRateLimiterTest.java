package com.projectsale.common.rateLimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import java.time.Duration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
class RedisRateLimiterTest {

  @Container
  private static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:8.8.0-alpine"))
          .withExposedPorts(6379);

  private static LettuceConnectionFactory connectionFactory;
  private static StringRedisTemplate redisTemplate;

  private RedisRateLimiter limiter;

  @BeforeAll
  static void connectRedis() {
    connectionFactory = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
    connectionFactory.afterPropertiesSet();
    connectionFactory.start();
    redisTemplate = new StringRedisTemplate(connectionFactory);
    redisTemplate.afterPropertiesSet();
  }

  @AfterAll
  static void disconnectRedis() {
    if (connectionFactory != null) {
      connectionFactory.destroy();
    }
  }

  @BeforeEach
  void setUp() {
    redisTemplate.execute((RedisCallback<Void>) connection -> {
      connection.serverCommands().flushDb();
      return null;
    });
    limiter = new RedisRateLimiter(redisTemplate);
  }

  @Test
  void admitsUpToTheLimitThenRejectsWithTheRemainingWindow() {
    Duration window = Duration.ofMinutes(15);
    for (int i = 0; i < 3; i++) {
      assertThat(limiter.tryAcquire("rl:test", 3, window).allowed()).isTrue();
    }

    RedisRateLimiter.Decision rejected = limiter.tryAcquire("rl:test", 3, window);

    assertThat(rejected.allowed()).isFalse();
    assertThat(rejected.retryAfterSeconds()).isBetween(890L, 900L);
    assertThat(redisTemplate.getExpire("rl:test")).isBetween(890L, 900L);
  }

  @Test
  void keysAreIndependent() {
    assertThat(limiter.tryAcquire("rl:a", 1, Duration.ofMinutes(1)).allowed()).isTrue();
    assertThat(limiter.tryAcquire("rl:a", 1, Duration.ofMinutes(1)).allowed()).isFalse();

    assertThat(limiter.tryAcquire("rl:b", 1, Duration.ofMinutes(1)).allowed()).isTrue();
  }

  @Test
  void theQuotaIsRestoredOnceTheWindowExpires() throws InterruptedException {
    Duration window = Duration.ofMillis(300);
    assertThat(limiter.tryAcquire("rl:short", 1, window).allowed()).isTrue();
    assertThat(limiter.tryAcquire("rl:short", 1, window).allowed()).isFalse();

    Thread.sleep(450);

    assertThat(limiter.tryAcquire("rl:short", 1, window).allowed()).isTrue();
  }

  @Test
  void aRejectionNeverAsksClientsToRetryImmediately() {
    Duration window = Duration.ofMillis(300);
    limiter.tryAcquire("rl:short", 1, window);

    assertThat(limiter.tryAcquire("rl:short", 1, window).retryAfterSeconds()).isEqualTo(1L);
  }

  @Test
  @SuppressWarnings("unchecked")
  void redisOutageFailsClosedAsARedisError() {
    StringRedisTemplate broken = mock(StringRedisTemplate.class);
    when(broken.execute(any(RedisScript.class), anyList(), any(Object[].class)))
        .thenThrow(new RedisConnectionFailureException("redis down"));

    assertThatThrownBy(() -> new RedisRateLimiter(broken)
        .tryAcquire("rl:test", 1, Duration.ofMinutes(1)))
        .isInstanceOfSatisfying(AppException.class,
            exception -> assertThat(exception.errorCode()).isEqualTo(ErrorCode.REDIS_ERROR));
  }
}
