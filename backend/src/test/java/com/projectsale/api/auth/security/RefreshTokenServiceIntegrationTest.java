package com.projectsale.api.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.projectsale.api.auth.security.dto.DeviceActivity;
import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.auth.security.dto.DevicePlatform;
import com.projectsale.api.auth.security.dto.IssuedRefreshToken;
import com.projectsale.api.auth.security.dto.RefreshSessionView;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.entity.User;
import com.projectsale.enums.RolesEnum;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
class RefreshTokenServiceIntegrationTest {

  @Container
  private static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:8.8.0-alpine"))
          .withExposedPorts(6379);

  private static LettuceConnectionFactory connectionFactory;
  private static StringRedisTemplate redisTemplate;

  private RefreshTokenService service;
  private User user;

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

    user = mock(User.class);
    UUID userId = UUID.randomUUID();
    when(user.getPublicId()).thenReturn(userId);
    when(user.getRole()).thenReturn(RolesEnum.USER);
    when(user.isActive()).thenReturn(true);

    UserRepository userRepository = mock(UserRepository.class);
    when(userRepository.findByPublicId(userId)).thenReturn(Optional.of(user));

    String secret = Base64.getEncoder().encodeToString(new byte[32]);
    JwtService jwtService = new JwtService(new JwtProperties(
        secret,
        "projectsale-api",
        "projectsale-web",
        Duration.ofMinutes(15),
        Duration.ofDays(30),
        Duration.ofSeconds(60)));
    service = new RefreshTokenService(jwtService, redisTemplate, userRepository);
  }

  @Test
  void issueListsMetadataAndReplacesPreviousSessionForSameDevice() {
    UUID deviceId = UUID.randomUUID();
    DeviceInfo device = new DeviceInfo(
        deviceId,
        "iPhone 14 của Nam",
        DevicePlatform.IOS,
        "iPhone User-Agent",
        "2001:db8::1");

    IssuedRefreshToken first = service.issue(user, device);
    IssuedRefreshToken second = service.issue(user, device);

    assertThatThrownBy(() -> service.verify(first.token()))
        .isInstanceOf(RefreshTokenService.RevokedRefreshTokenException.class);
    assertThat(service.verify(second.token()).deviceId()).isEqualTo(deviceId);
    assertThat(service.listSessions(user.getPublicId(), second.sessionId()))
        .singleElement()
        .satisfies(session -> {
          assertThat(session.sessionId()).isEqualTo(second.sessionId());
          assertThat(session.displayName()).isEqualTo("iPhone 14 của Nam");
          assertThat(session.platform()).isEqualTo(DevicePlatform.IOS);
          assertThat(session.currentSession()).isTrue();
        });
    assertThat(Arrays.stream(RefreshSessionView.class.getRecordComponents())
        .map(component -> component.getName()))
        .doesNotContain("currentTokenId");
  }

  @Test
  void concurrentRotationAllowsOneWinnerAndReplayRevokesSession() throws Exception {
    IssuedRefreshToken issued = service.issue(
        user,
        new DeviceInfo(UUID.randomUUID(), "Windows PC", DevicePlatform.WINDOWS, null, null));
    CountDownLatch start = new CountDownLatch(1);

    try (var executor = Executors.newFixedThreadPool(2)) {
      Future<IssuedRefreshToken> first = executor.submit(() -> {
        start.await();
        return service.rotate(issued.token(), new DeviceActivity(null, "10.0.0.1"));
      });
      Future<IssuedRefreshToken> second = executor.submit(() -> {
        start.await();
        return service.rotate(issued.token(), new DeviceActivity(null, "10.0.0.2"));
      });
      start.countDown();

      int successes = 0;
      IssuedRefreshToken winner = null;
      for (Future<IssuedRefreshToken> future : List.of(first, second)) {
        try {
          winner = future.get();
          successes++;
        } catch (java.util.concurrent.ExecutionException exception) {
          assertThat(exception.getCause())
              .isInstanceOf(RefreshTokenService.ReplayedRefreshTokenException.class);
        }
      }

      assertThat(successes).isEqualTo(1);
      IssuedRefreshToken winningToken = winner;
      assertThatThrownBy(() -> service.verify(winningToken.token()))
          .isInstanceOf(RefreshTokenService.RevokedRefreshTokenException.class);
    }
  }

  @Test
  void revokesOneSessionOrAllUserSessions() {
    IssuedRefreshToken phone = service.issue(
        user,
        new DeviceInfo(UUID.randomUUID(), "Phone", DevicePlatform.ANDROID, null, null));
    IssuedRefreshToken laptop = service.issue(
        user,
        new DeviceInfo(UUID.randomUUID(), "Laptop", DevicePlatform.WINDOWS, null, null));

    service.revokeSession(user.getPublicId(), phone.sessionId());

    assertThatThrownBy(() -> service.verify(phone.token()))
        .isInstanceOf(RefreshTokenService.RevokedRefreshTokenException.class);
    assertThat(service.verify(laptop.token()).sessionId()).isEqualTo(laptop.sessionId());
    assertThat(service.listSessions(user.getPublicId(), null))
        .extracting(RefreshSessionView::sessionId)
        .containsExactly(laptop.sessionId());

    service.revokeAll(user.getPublicId());

    assertThatThrownBy(() -> service.verify(laptop.token()))
        .isInstanceOf(RefreshTokenService.RevokedRefreshTokenException.class);
    assertThat(service.listSessions(user.getPublicId(), null)).isEmpty();
  }

  @Test
  void revokesTheSessionIdentifiedByRefreshToken() {
    IssuedRefreshToken issued = service.issue(
        user,
        new DeviceInfo(UUID.randomUUID(), "Tablet", DevicePlatform.ANDROID, null, null));

    service.revoke(issued.token());

    assertThatThrownBy(() -> service.verify(issued.token()))
        .isInstanceOf(RefreshTokenService.RevokedRefreshTokenException.class);
    assertThat(service.listSessions(user.getPublicId(), null)).isEmpty();
  }
}
