package com.projectsale.api.auth.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.projectsale.entity.User;

import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Phát hành và xác minh access token (JWT HS256) từ khoá bí mật cấu hình sẵn. */
@Service
public class JwtService {

  private static final int MIN_SECRET_BYTES = 32;

  private final JwtProperties jwtProperties;
  private final byte[] secretKey;

  public JwtService(JwtProperties jwtProperties) {
    this.jwtProperties = jwtProperties;
    try {
      this.secretKey = Base64.getDecoder().decode(jwtProperties.secretBase64());
    } catch (Exception e) {
      throw new IllegalStateException("JWT_SECRET_BASE64 must be valid base64", e);
    }
    if (secretKey.length < MIN_SECRET_BYTES) {
      throw new IllegalStateException("JWT_SECRET_BASE64 must decode to at least 32 bytes");
    }
  }

  public String issue(User user) {
    try {
      Instant now = Instant.now();
      JWTClaimsSet claims =
          new JWTClaimsSet.Builder()
              .subject(user.getPublicId().toString())
              .issuer(jwtProperties.issuer())
              .audience(jwtProperties.audience())
              .issueTime(Date.from(now))
              .expirationTime(Date.from(now.plus(jwtProperties.accessTtl())))
              .jwtID(UUID.randomUUID().toString())
              .claim("role", user.getRole().name())
              .build();
      SignedJWT signedJwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
      signedJwt.sign(new MACSigner(secretKey));
      return signedJwt.serialize();
    } catch (JOSEException e) {
      throw new IllegalStateException("Cannot sign JWT", e);
    }
  }

  public Claims verify(String rawToken) {
    try {
      SignedJWT signedJwt = SignedJWT.parse(rawToken);
      boolean validSignature =
          signedJwt.verify(new MACVerifier(secretKey))
              && JWSAlgorithm.HS256.equals(signedJwt.getHeader().getAlgorithm());
      if (!validSignature) {
        throw new JOSEException("Invalid signature");
      }
      JWTClaimsSet claims = signedJwt.getJWTClaimsSet();
      if (!claimsValid(claims)) {
        throw new JOSEException("Invalid claims");
      }
      return new Claims(UUID.fromString(claims.getSubject()), claims.getStringClaim("role"));
    } catch (Exception e) {
      throw new InvalidJwtException();
    }
  }

  private boolean claimsValid(JWTClaimsSet claims) {
    Instant now = Instant.now();
    Duration clockSkew = jwtProperties.clockSkew();
    return jwtProperties.issuer().equals(claims.getIssuer())
        && claims.getAudience().contains(jwtProperties.audience())
        && claims.getExpirationTime() != null
        && !claims.getExpirationTime().toInstant().plus(clockSkew).isBefore(now);
  }

  public record Claims(UUID userId, String role) {}

  public static class InvalidJwtException extends RuntimeException {}
}
