package com.projectsale.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.projectsale.api.auth.service.OAuth2LoginCodeService.PendingLogin;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.common.util.Hashing;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/** Runs against real Redis: single use relies on the atomic GETDEL command. */
@Testcontainers
class OAuth2LoginCodeServiceTest {

  private static final String BIND = "b".repeat(43);

  @Container
  private static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:8.8.0-alpine"))
          .withExposedPorts(6379);

  private static LettuceConnectionFactory connectionFactory;
  private static StringRedisTemplate redisTemplate;

  private OAuth2LoginCodeService service;

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
    service = new OAuth2LoginCodeService(redisTemplate);
  }

  @Test
  void issuedCodeIsUrlSafeAndStoredOnlyAsAHashWithShortTtl() {
    UUID userId = UUID.randomUUID();

    String code = service.issue(userId, BIND);

    assertThat(code).matches("^[A-Za-z0-9_-]{43}$");
    String key = "auth:oauth2:code:" + Hashing.sha256Hex(code);
    assertThat(redisTemplate.opsForValue().get(key)).isEqualTo(userId + "|" + BIND);
    assertThat(redisTemplate.keys("*")).noneMatch(stored -> stored.contains(code));
    Long ttl = redisTemplate.getExpire(key);
    assertThat(ttl).isBetween(1L, OAuth2LoginCodeService.CODE_TTL.toSeconds());
  }

  @Test
  void codeCanBeConsumedExactlyOnce() {
    UUID userId = UUID.randomUUID();
    String code = service.issue(userId, BIND);

    Optional<PendingLogin> first = service.consume(code);
    Optional<PendingLogin> second = service.consume(code);

    assertThat(first).contains(new PendingLogin(userId, BIND));
    assertThat(second).isEmpty();
  }

  @Test
  void unknownOrMalformedCodeIsEmptyWithoutError() {
    assertThat(service.consume("never-issued")).isEmpty();
    assertThat(service.consume("")).isEmpty();
    assertThat(service.consume(null)).isEmpty();
    assertThat(service.consume("x".repeat(500))).isEmpty();
  }

  @Test
  void corruptedStoredValueIsTreatedAsUnknown() {
    String code = "c".repeat(43);
    redisTemplate.opsForValue().set("auth:oauth2:code:" + Hashing.sha256Hex(code), "garbage");

    assertThat(service.consume(code)).isEmpty();
  }

  @Test
  void redisFailureMapsToRedisError() {
    StringRedisTemplate broken = mock(StringRedisTemplate.class);
    when(broken.opsForValue()).thenThrow(new RedisConnectionFailureException("down"));
    OAuth2LoginCodeService brokenService = new OAuth2LoginCodeService(broken);

    assertThatThrownBy(() -> brokenService.issue(UUID.randomUUID(), BIND))
        .isInstanceOfSatisfying(AppException.class,
            exception -> assertThat(exception.errorCode()).isEqualTo(ErrorCode.REDIS_ERROR));
    assertThatThrownBy(() -> brokenService.consume("c".repeat(43)))
        .isInstanceOfSatisfying(AppException.class,
            exception -> assertThat(exception.errorCode()).isEqualTo(ErrorCode.REDIS_ERROR));
  }

  @Test
  void issueRejectsMissingArguments() {
    assertThatThrownBy(() -> service.issue(null, BIND)).isInstanceOf(NullPointerException.class);
    assertThatThrownBy(() -> service.issue(UUID.randomUUID(), null))
        .isInstanceOf(NullPointerException.class);
  }
}
