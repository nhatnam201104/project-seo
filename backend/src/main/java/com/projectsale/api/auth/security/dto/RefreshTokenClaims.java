package com.projectsale.api.auth.security.dto;

import java.time.Instant;
import java.util.UUID;

/** Validated cryptographic claims from a refresh JWT. */
public record RefreshTokenClaims(
    UUID userId, UUID sessionId, UUID tokenId, Instant expiresAt) {}
