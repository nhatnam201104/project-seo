package com.projectsale.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
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

/** Runs against real Redis: atomicity of the Lua scripts cannot be proven with mocks. */
@Testcontainers
class OtpServiceTest {

  private static final String CODE_KEY = "otp:member@example.com";
  private static final String ATTEMPTS_KEY = "otp:attempts:member@example.com";

  @Container
  private static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:8.8.0-alpine"))
          .withExposedPorts(6379);

  private static LettuceConnectionFactory connectionFactory;
  private static StringRedisTemplate redisTemplate;

  private OtpService service;

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
    service = new OtpService(redisTemplate);
  }

  @Test
  void issueStoresOnlyTheHashOfASixDigitCodeUnderANormalizedKeyWithTtl() {
    String otp = service.issue("  Member@Example.COM ");

    assertThat(otp).matches("\\d{6}");
    assertThat(redisTemplate.opsForValue().get(CODE_KEY)).isNotEqualTo(otp).isEqualTo(sha256(otp));
    assertThat(redisTemplate.getExpire(CODE_KEY)).isBetween(290L, 300L);
  }

  @Test
  void verifyAcceptsTheIssuedCodeOnceAndThenBurnsIt() {
    String otp = service.issue("member@example.com");

    assertThatCode(() -> service.verify("Member@example.com", otp)).doesNotThrowAnyException();
    assertThat(redisTemplate.hasKey(CODE_KEY)).isFalse();
    assertThat(redisTemplate.hasKey(ATTEMPTS_KEY)).isFalse();
    assertAppError(() -> service.verify("member@example.com", otp), ErrorCode.INVALID_OTP);
  }

  @Test
  void aWrongGuessKeepsTheCodeUsableAndBoundsTheAttemptWindow() {
    String otp = service.issue("member@example.com");

    assertAppError(() -> service.verify("member@example.com", wrong(otp)), ErrorCode.INVALID_OTP);

    assertThat(redisTemplate.getExpire(ATTEMPTS_KEY)).isBetween(290L, 300L);
    assertThatCode(() -> service.verify("member@example.com", otp)).doesNotThrowAnyException();
  }

  @Test
  void verifyRejectsWhenNoCodeWasIssuedOrItExpired() {
    assertAppError(() -> service.verify("member@example.com", "123456"), ErrorCode.INVALID_OTP);
  }

  @Test
  void theCodeIsBurnedOnceTheAttemptBudgetIsExhaustedEvenIfTheNextGuessIsRight() {
    String otp = service.issue("member@example.com");
    for (int i = 0; i < OtpService.MAX_ATTEMPTS; i++) {
      assertAppError(() -> service.verify("member@example.com", wrong(otp)), ErrorCode.INVALID_OTP);
    }

    assertAppError(() -> service.verify("member@example.com", otp), ErrorCode.INVALID_OTP);
    assertThat(redisTemplate.hasKey(CODE_KEY)).isFalse();
  }

  @Test
  void aFreshCodeGetsAFreshAttemptBudget() {
    String first = service.issue("member@example.com");
    for (int i = 0; i < OtpService.MAX_ATTEMPTS; i++) {
      assertAppError(() -> service.verify("member@example.com", wrong(first)), ErrorCode.INVALID_OTP);
    }

    String second = service.issue("member@example.com");

    assertThatCode(() -> service.verify("member@example.com", second)).doesNotThrowAnyException();
  }

  @Test
  void concurrentSubmissionsOfTheSameCorrectCodeSucceedExactlyOnce() throws Exception {
    String otp = service.issue("member@example.com");
    int callers = 10;
    CountDownLatch start = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(callers);
    try {
      List<Future<Boolean>> results = new ArrayList<>();
      for (int i = 0; i < callers; i++) {
        results.add(pool.submit((Callable<Boolean>) () -> {
          start.await();
          try {
            service.verify("member@example.com", otp);
            return true;
          } catch (AppException exception) {
            return false;
          }
        }));
      }
      start.countDown();

      int successes = 0;
      for (Future<Boolean> result : results) {
        successes += result.get() ? 1 : 0;
      }
      assertThat(successes).isEqualTo(1);
    } finally {
      pool.shutdownNow();
    }
  }

  @Test
  @SuppressWarnings("unchecked")
  void redisFailuresSurfaceAsRedisErrors() {
    StringRedisTemplate broken = mock(StringRedisTemplate.class);
    when(broken.execute(any(RedisScript.class), anyList(), any(Object[].class)))
        .thenThrow(new RedisConnectionFailureException("redis down"));
    OtpService failing = new OtpService(broken);

    assertAppError(() -> failing.issue("member@example.com"), ErrorCode.REDIS_ERROR);
    assertAppError(() -> failing.verify("member@example.com", "123456"), ErrorCode.REDIS_ERROR);
  }

  private static String wrong(String otp) {
    return otp.equals("000000") ? "000001" : "000000";
  }

  private static String sha256(String value) {
    try {
      return HexFormat.of().formatHex(
          MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }

  private static void assertAppError(
      org.assertj.core.api.ThrowableAssert.ThrowingCallable call, ErrorCode errorCode) {
    assertThatThrownBy(call).isInstanceOfSatisfying(AppException.class,
        exception -> assertThat(exception.errorCode()).isEqualTo(errorCode));
  }
}
