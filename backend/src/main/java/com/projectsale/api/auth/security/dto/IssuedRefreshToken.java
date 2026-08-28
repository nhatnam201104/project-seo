package com.projectsale.api.auth.security.dto;

import java.time.Instant;
import java.util.UUID;

/** Refresh token returned after a successful issue or rotation transition. */
public record IssuedRefreshToken(
    String token, UUID sessionId, UUID tokenId, UUID deviceId, Instant expiresAt) {}
