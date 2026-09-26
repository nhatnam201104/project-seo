package com.projectsale.api.auth.security.dto;

import java.time.Instant;
import java.util.UUID;

/** UI-safe view of a refresh session. Never exposes the current refresh-token JTI. */
public record RefreshSessionView(
    UUID sessionId,
    UUID deviceId,
    String displayName,
    DevicePlatform platform,
    String userAgent,
    String lastIp,
    Instant createdAt,
    Instant lastSeenAt,
    boolean currentSession) {}
