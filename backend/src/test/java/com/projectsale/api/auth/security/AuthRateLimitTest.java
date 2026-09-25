package com.projectsale.api.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.projectsale.api.auth.controller.AuthController;
import com.projectsale.api.auth.dto.AuthRequest.LoginRequest;
import com.projectsale.api.auth.dto.AuthRequest.RefreshRequest;
import com.projectsale.api.auth.dto.AuthRequest.ResendOTP;
import com.projectsale.api.auth.service.AuthService;
import com.projectsale.common.exception.RateLimitExceededException;
import com.projectsale.common.rateLimit.RateLimitAspect;
import com.projectsale.common.rateLimit.RedisRateLimiter;
import com.projectsale.common.web.ClientRequestResolver;
import com.projectsale.common.web.ProxyProperties;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Drives the real {@link AuthController} through a real AOP proxy and real Redis, so the
 * pointcut, the repeatable annotations, the key derivation and the Lua script are all exercised.
 */
@Testcontainers
class AuthRateLimitTest {

  private static final String SECRET = "k".repeat(48);
  private static final String SSR_IP = "10.0.0.5";

  @Container
  private static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:8.8.0-alpine"))
          .withExposedPorts(6379);

  private static LettuceConnectionFactory connectionFactory;
  private static StringRedisTemplate redisTemplate;

  private AuthController controller;

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
    ClientRequestResolver resolver = new ClientRequestResolver(new ProxyProperties(SECRET));
    AspectJProxyFactory factory =
        new AspectJProxyFactory(new AuthController(mock(AuthService.class), resolver));
    factory.setProxyTargetClass(true);
    factory.addAspect(new RateLimitAspect(new RedisRateLimiter(redisTemplate), resolver));
    controller = factory.getProxy();
  }

  @AfterEach
  void cleanRequestContext() {
    RequestContextHolder.resetRequestAttributes();
  }

  @Test
  void twoBrowsersBehindTheSameSsrServerHaveIndependentIpBuckets() {
    // Distinct emails so only the per-IP login rule (20 / 15 min) is in play.
    for (int i = 0; i < 20; i++) {
      login("203.0.113.1", "user" + i + "@example.com");
    }
    assertThatThrownBy(() -> login("203.0.113.1", "user20@example.com"))
        .isInstanceOf(RateLimitExceededException.class);

    assertThatCode(() -> login("198.51.100.9", "someone@example.com"))
        .doesNotThrowAnyException();
  }

  @Test
  void oneAccountIsProtectedEvenWhenTheAttackerRotatesIps() {
    for (int i = 0; i < 10; i++) {
      // Case and whitespace variants must count against the same account.
      String email = i % 2 == 0 ? "victim@example.com" : "  Victim@Example.COM ";
      login("203.0.113." + (i + 1), email);
    }

    assertThatThrownBy(() -> login("203.0.113.200", "victim@example.com"))
        .isInstanceOfSatisfying(RateLimitExceededException.class,
            exception -> assertThat(exception.retryAfterSeconds()).isBetween(1L, 900L));
    assertThatCode(() -> login("203.0.113.200", "other@example.com")).doesNotThrowAnyException();
  }

  @Test
  void eachEndpointHasItsOwnBudget() {
    bindClient("203.0.113.1");
    controller.resendOTP(new ResendOTP("member@example.com"));
    assertThatThrownBy(() -> controller.resendOTP(new ResendOTP("member@example.com")))
        .isInstanceOf(RateLimitExceededException.class);

    assertThatCode(() -> login("203.0.113.1", "member@example.com")).doesNotThrowAnyException();
  }

  @Test
  void refreshIsRateLimitedPerClient() {
    bindClient("203.0.113.1");
    for (int i = 0; i < 30; i++) {
      controller.refresh(new RefreshRequest("token-" + i), currentRequest());
    }
    assertThatThrownBy(() -> controller.refresh(new RefreshRequest("token-x"), currentRequest()))
        .isInstanceOf(RateLimitExceededException.class);
  }

  @Test
  void withoutTheSharedSecretEveryoneBehindTheSsrServerSharesOneBucket() {
    // Documents why INTERNAL_PROXY_SECRET is mandatory in production.
    for (int i = 0; i < 20; i++) {
      bindUntrustedClient("203.0.113." + (i + 1));
      controller.login(loginRequest("user" + i + "@example.com"), currentRequest());
    }
    bindUntrustedClient("198.51.100.9");
    assertThatThrownBy(() -> controller.login(loginRequest("late@example.com"), currentRequest()))
        .isInstanceOf(RateLimitExceededException.class);
  }

  private void login(String browserIp, String email) {
    bindClient(browserIp);
    controller.login(loginRequest(email), currentRequest());
  }

  private static LoginRequest loginRequest(String email) {
    return new LoginRequest(email, UUID.randomUUID(), null, null, "secret123");
  }

  private static void bindClient(String browserIp) {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr(SSR_IP);
    request.addHeader(ClientRequestResolver.PROXY_SECRET, SECRET);
    request.addHeader(ClientRequestResolver.FORWARDED_FOR, browserIp);
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
  }

  private static void bindUntrustedClient(String claimedIp) {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr(SSR_IP);
    request.addHeader(ClientRequestResolver.FORWARDED_FOR, claimedIp);
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
  }

  private static MockHttpServletRequest currentRequest() {
    return (MockHttpServletRequest) ((ServletRequestAttributes)
        RequestContextHolder.currentRequestAttributes()).getRequest();
  }
}
