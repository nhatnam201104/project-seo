package com.projectsale.api.auth.security.dto;

import java.time.Instant;
import java.util.UUID;

/** Signed refresh JWT together with server-side metadata needed for persistence. */
public record IssuedRefreshJwt(String token, UUID tokenId, Instant expiresAt) {}
