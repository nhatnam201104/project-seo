package com.projectsale.api.auth.security.internal;

/** Redis keys participating in one refresh-session state transition. */
public record RefreshTokenKeys(
    String session, String sessions, String device, String sessionPrefix) {}
