package com.projectsale.api.auth.security.dto;

import java.time.Instant;
import java.util.UUID;

/** Refresh token identity after JWT and Redis session verification. */
public record VerifiedRefreshToken(
    UUID userId, UUID sessionId, UUID deviceId, UUID tokenId, Instant expiresAt) {}
