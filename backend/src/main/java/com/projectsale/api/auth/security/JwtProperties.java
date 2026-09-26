package com.projectsale.api.auth.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Cấu hình JWT (prefix {@code app.jwt}). */
@ConfigurationProperties("app.jwt")
public record JwtProperties(
    String secretBase64,
    String issuer,
    String audience,
    Duration accessTtl,
    Duration refreshTtl,
    Duration clockSkew) {}
