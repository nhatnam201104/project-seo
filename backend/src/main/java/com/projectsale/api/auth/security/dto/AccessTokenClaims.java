package com.projectsale.api.auth.security.dto;

import java.time.Instant;
import java.util.UUID;

/** Validated access-token claims used by the authentication filter. */
public record AccessTokenClaims(
    UUID userId, String role, UUID sessionId, UUID tokenId, Instant expiresAt) {}
