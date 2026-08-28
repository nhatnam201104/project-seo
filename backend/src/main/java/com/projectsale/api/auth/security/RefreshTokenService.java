package com.projectsale.api.auth.security;

import com.projectsale.api.auth.security.dto.DeviceActivity;
import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.auth.security.dto.DevicePlatform;
import com.projectsale.api.auth.security.dto.IssuedRefreshJwt;
import com.projectsale.api.auth.security.dto.IssuedRefreshToken;
import com.projectsale.api.auth.security.dto.RefreshSessionView;
import com.projectsale.api.auth.security.dto.RefreshTokenClaims;
import com.projectsale.api.auth.security.dto.VerifiedRefreshToken;
import com.projectsale.api.auth.security.internal.RefreshTokenKeys;
import com.projectsale.api.auth.security.internal.StoredRefreshSession;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.entity.User;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

/**
 * Stateful lifecycle manager for JWT refresh tokens and per-device sessions in
 * Redis.
 */
@Service
public class RefreshTokenService {

  private static final String KEY_PREFIX = "auth:refresh:";
  private static final long SCRIPT_SUCCESS = 1L;
  private static final long SCRIPT_REPLAY = -1L;

  private static final DefaultRedisScript<Long> ISSUE_SCRIPT = script("redis/refresh-token/issue.lua");
  private static final DefaultRedisScript<Long> ROTATE_SCRIPT = script("redis/refresh-token/rotate.lua");
  private static final DefaultRedisScript<Long> REVOKE_SCRIPT = script("redis/refresh-token/revoke.lua");
  private static final DefaultRedisScript<Long> REVOKE_ALL_SCRIPT = script("redis/refresh-token/revoke-all.lua");

  private final JwtService jwtService;
  private final StringRedisTemplate redisTemplate;
  private final UserRepository userRepository;

  public RefreshTokenService(
      JwtService jwtService,
      StringRedisTemplate redisTemplate,
      UserRepository userRepository) {
    this.jwtService = jwtService;
    this.redisTemplate = redisTemplate;
    this.userRepository = userRepository;
  }

  public IssuedRefreshToken issue(User user, DeviceInfo device) {
    Objects.requireNonNull(user, "user is required");
    Objects.requireNonNull(device, "device is required");
    if (user.getPublicId() == null || !user.isActive()) {
      throw new InvalidRefreshTokenException();
    }

    UUID userId = user.getPublicId();
    UUID sessionId = UUID.randomUUID();
    IssuedRefreshJwt issued = jwtService.createSignedRefreshJwt(user, sessionId);
    Instant now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    long ttlMillis = positiveTtlMillis(issued.expiresAt());
    RefreshTokenKeys keys = keys(userId, sessionId, device.deviceId());

    Long result = execute(
        ISSUE_SCRIPT,
        List.of(keys.session(), keys.sessions(), keys.device()),
        sessionId.toString(),
        userId.toString(),
        device.deviceId().toString(),
        value(device.displayName()),
        device.platform().name(),
        value(device.userAgent()),
        value(device.ipAddress()),
        issued.tokenId().toString(),
        epochMillis(now),
        epochMillis(now),
        epochMillis(issued.expiresAt()),
        Long.toString(ttlMillis),
        keys.sessionPrefix());
    if (result == null || result != SCRIPT_SUCCESS) {
      throw new RefreshTokenStoreException();
    }

    return new IssuedRefreshToken(
        issued.token(), sessionId, issued.tokenId(), device.deviceId(), issued.expiresAt());
  }

  public VerifiedRefreshToken verify(String rawToken) {
    RefreshTokenClaims claims = parse(rawToken);
    StoredRefreshSession session = loadSession(claims.userId(), claims.sessionId());
    if (session == null) {
      throw new RevokedRefreshTokenException();
    }
    if (!claims.userId().equals(session.userId())
        || !claims.sessionId().equals(session.sessionId())) {
      revokeSession(claims.userId(), claims.sessionId());
      throw new InvalidRefreshTokenException();
    }
    if (!claims.tokenId().equals(session.currentTokenId())) {
      revokeSession(claims.userId(), claims.sessionId());
      throw new ReplayedRefreshTokenException();
    }
    if (!session.expiresAt().isAfter(Instant.now())) {
      revokeSession(claims.userId(), claims.sessionId());
      throw new RevokedRefreshTokenException();
    }

    User user = activeUser(claims.userId());
    return new VerifiedRefreshToken(
        user.getPublicId(), session.sessionId(), session.deviceId(), claims.tokenId(),
        claims.expiresAt());
  }

  public IssuedRefreshToken rotate(String rawToken, DeviceActivity activity) {
    VerifiedRefreshToken verified = verify(rawToken);
    User user = activeUser(verified.userId());
    IssuedRefreshJwt next = jwtService.createSignedRefreshJwt(user, verified.sessionId());
    DeviceActivity normalizedActivity = activity == null ? new DeviceActivity(null, null) : activity;
    Instant now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    long ttlMillis = positiveTtlMillis(next.expiresAt());
    RefreshTokenKeys keys = keys(verified.userId(), verified.sessionId(), verified.deviceId());

    Long result = execute(
        ROTATE_SCRIPT,
        List.of(keys.session(), keys.sessions(), keys.device()),
        verified.sessionId().toString(),
        verified.tokenId().toString(),
        next.tokenId().toString(),
        value(normalizedActivity.userAgent()),
        value(normalizedActivity.ipAddress()),
        epochMillis(now),
        epochMillis(next.expiresAt()),
        Long.toString(ttlMillis));

    if (result != null && result == SCRIPT_REPLAY) {
      throw new ReplayedRefreshTokenException();
    }
    if (result == null || result != SCRIPT_SUCCESS) {
      throw new RevokedRefreshTokenException();
    }
    return new IssuedRefreshToken(
        next.token(), verified.sessionId(), next.tokenId(), verified.deviceId(), next.expiresAt());
  }

  public void revoke(String rawToken) {
    RefreshTokenClaims claims = parse(rawToken);
    revokeSession(claims.userId(), claims.sessionId());
  }

  public void revokeSession(UUID userId, UUID sessionId) {
    Objects.requireNonNull(userId, "userId is required");
    Objects.requireNonNull(sessionId, "sessionId is required");
    String sessionKey = sessionKey(userId, sessionId);
    String deviceId = hashValue(sessionKey, "deviceId");
    String deviceKey = deviceId == null
        ? devicePrefix(userId) + "missing-" + sessionId
        : deviceKey(userId, UUID.fromString(deviceId));
    
    execute(
        REVOKE_SCRIPT,
        List.of(sessionKey, sessionsKey(userId), deviceKey),
        sessionId.toString());
  }

  public void revokeAll(UUID userId) {
    Objects.requireNonNull(userId, "userId is required");
    execute(
        REVOKE_ALL_SCRIPT,
        List.of(sessionsKey(userId)),
        sessionPrefix(userId),
        devicePrefix(userId));
  }

  public List<RefreshSessionView> listSessions(UUID userId, UUID currentSessionId) {
    Objects.requireNonNull(userId, "userId is required");
    try {
      Set<String> sessionIds = redisTemplate.opsForSet().members(sessionsKey(userId));
      if (sessionIds == null || sessionIds.isEmpty()) {
        return List.of();
      }

      List<RefreshSessionView> sessions = new ArrayList<>();
      List<String> staleSessionIds = new ArrayList<>();
      Instant now = Instant.now();
      for (String rawSessionId : sessionIds) {
        UUID sessionId = uuid(rawSessionId);
        StoredRefreshSession session = sessionId == null ? null : loadSession(userId, sessionId);
        if (session == null || !session.expiresAt().isAfter(now)) {
          staleSessionIds.add(rawSessionId);
          continue;
        }
        sessions.add(new RefreshSessionView(
            session.sessionId(),
            session.deviceId(),
            session.displayName(),
            session.platform(),
            session.userAgent(),
            session.lastIp(),
            session.createdAt(),
            session.lastSeenAt(),
            session.sessionId().equals(currentSessionId)));
      }
      cleanStaleIndex(userId, staleSessionIds);
      sessions.sort(Comparator.comparing(RefreshSessionView::lastSeenAt).reversed());
      return List.copyOf(sessions);
    } catch (RefreshTokenException exception) {
      throw exception;
    } catch (DataAccessException exception) {
      throw new RefreshTokenStoreException(exception);
    }
  }

  private StoredRefreshSession loadSession(UUID userId, UUID sessionId) {
    try {
      Map<Object, Object> values = redisTemplate.opsForHash().entries(sessionKey(userId, sessionId));
      if (values == null || values.isEmpty()) {
        return null;
      }
      return storedSessionFrom(values);
    } catch (RefreshTokenException exception) {
      throw exception;
    } catch (Exception exception) {
      if (exception instanceof DataAccessException dataAccessException) {
        throw new RefreshTokenStoreException(dataAccessException);
      }
      throw new InvalidRefreshTokenException();
    }
  }

  private User activeUser(UUID userId) {
    return userRepository.findByPublicId(userId)
        .filter(User::isActive)
        .orElseThrow(RevokedRefreshTokenException::new);
  }

  private RefreshTokenClaims parse(String rawToken) {
    try {
      return jwtService.verifyRefreshToken(rawToken);
    } catch (JwtService.InvalidJwtException exception) {
      throw new InvalidRefreshTokenException();
    }
  }

  private String hashValue(String key, String field) {
    try {
      Object value = redisTemplate.opsForHash().get(key, field);
      return value == null ? null : value.toString();
    } catch (DataAccessException exception) {
      throw new RefreshTokenStoreException(exception);
    }
  }

  private void cleanStaleIndex(UUID userId, List<String> staleSessionIds) {
    if (staleSessionIds.isEmpty()) {
      return;
    }
    String key = sessionsKey(userId);
    redisTemplate.opsForSet().remove(key, staleSessionIds.toArray());
    Long size = redisTemplate.opsForSet().size(key);
    if (size != null && size == 0L) {
      redisTemplate.delete(key);
    }
  }

  private Long execute(DefaultRedisScript<Long> script, List<String> keys, String... arguments) {
    try {
      return redisTemplate.execute(script, keys, (Object[]) arguments);
    } catch (DataAccessException exception) {
      throw new RefreshTokenStoreException(exception);
    }
  }

  private static DefaultRedisScript<Long> script(String path) {
    DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    script.setLocation(new ClassPathResource(path));
    script.setResultType(Long.class);
    return script;
  }

  private static long positiveTtlMillis(Instant expiresAt) {
    long ttlMillis = Duration.between(Instant.now(), expiresAt).toMillis();
    if (ttlMillis <= 0) {
      throw new InvalidRefreshTokenException();
    }
    return ttlMillis;
  }

  private static String value(String value) {
    return value == null ? "" : value;
  }

  private static String epochMillis(Instant value) {
    return Long.toString(value.toEpochMilli());
  }

  private static RefreshTokenKeys keys(UUID userId, UUID sessionId, UUID deviceId) {
    return new RefreshTokenKeys(
        sessionKey(userId, sessionId),
        sessionsKey(userId),
        deviceKey(userId, deviceId),
        sessionPrefix(userId));
  }

  private static String userPrefix(UUID userId) {
    return KEY_PREFIX + "{" + userId + "}:";
  }

  private static String sessionPrefix(UUID userId) {
    return userPrefix(userId) + "session:";
  }

  private static String sessionKey(UUID userId, UUID sessionId) {
    return sessionPrefix(userId) + sessionId;
  }

  private static String sessionsKey(UUID userId) {
    return userPrefix(userId) + "sessions";
  }

  private static String devicePrefix(UUID userId) {
    return userPrefix(userId) + "device:";
  }

  private static String deviceKey(UUID userId, UUID deviceId) {
    return devicePrefix(userId) + deviceId;
  }

  private static UUID uuid(Object value) {
    try {
      return value == null ? null : UUID.fromString(value.toString());
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  private static Instant instant(Object value) {
    try {
      return Instant.ofEpochMilli(Long.parseLong(value.toString()));
    } catch (Exception exception) {
      throw new InvalidRefreshTokenException();
    }
  }

  private static String nullable(Object value) {
    if (value == null || value.toString().isBlank()) {
      return null;
    }
    return value.toString();
  }

  private static DevicePlatform platform(Object value) {
    try {
      return DevicePlatform.valueOf(value.toString());
    } catch (Exception exception) {
      return DevicePlatform.UNKNOWN;
    }
  }

  private static StoredRefreshSession storedSessionFrom(Map<Object, Object> values) {
    UUID sessionId = uuid(values.get("sessionId"));
    UUID userId = uuid(values.get("userId"));
    UUID deviceId = uuid(values.get("deviceId"));
    UUID tokenId = uuid(values.get("currentJti"));
    if (sessionId == null || userId == null || deviceId == null || tokenId == null) {
      throw new InvalidRefreshTokenException();
    }
    return new StoredRefreshSession(
        sessionId,
        userId,
        deviceId,
        nullable(values.get("displayName")),
        RefreshTokenService.platform(values.get("platform")),
        nullable(values.get("userAgent")),
        nullable(values.get("lastIp")),
        tokenId,
        instant(values.get("createdAt")),
        instant(values.get("lastSeenAt")),
        instant(values.get("expiresAt")));
  }

  public abstract static class RefreshTokenException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    protected RefreshTokenException() {
    }

    protected RefreshTokenException(Throwable cause) {
      super(cause);
    }
  }

  public static final class InvalidRefreshTokenException extends RefreshTokenException {
    private static final long serialVersionUID = 1L;
  }

  public static final class RevokedRefreshTokenException extends RefreshTokenException {
    private static final long serialVersionUID = 1L;
  }

  public static final class ReplayedRefreshTokenException extends RefreshTokenException {
    private static final long serialVersionUID = 1L;
  }

  public static final class RefreshTokenStoreException extends RefreshTokenException {
    private static final long serialVersionUID = 1L;

    private RefreshTokenStoreException() {
    }

    private RefreshTokenStoreException(Throwable cause) {
      super(cause);
    }
  }
}
