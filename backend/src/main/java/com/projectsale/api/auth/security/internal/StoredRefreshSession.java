package com.projectsale.api.auth.security.internal;

import com.projectsale.api.auth.security.dto.DevicePlatform;
import java.time.Instant;
import java.util.UUID;

/** Typed representation of a refresh-session Redis hash. */
public record StoredRefreshSession(
    UUID sessionId,
    UUID userId,
    UUID deviceId,
    String displayName,
    DevicePlatform platform,
    String userAgent,
    String lastIp,
    UUID currentTokenId,
    Instant createdAt,
    Instant lastSeenAt,
    Instant expiresAt) {}
