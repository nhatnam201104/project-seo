package com.projectsale.api.auth.security.internal;

import java.time.Instant;
import java.util.UUID;

/** Internal result of the shared JWT signing path. */
public record SignedJwt(String token, UUID tokenId, Instant expiresAt) {}
