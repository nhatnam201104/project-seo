package com.projectsale.api.auth.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.projectsale.api.auth.security.dto.AccessTokenClaims;
import com.projectsale.api.auth.security.dto.IssuedRefreshJwt;
import com.projectsale.api.auth.security.dto.RefreshTokenClaims;
import com.projectsale.api.auth.security.internal.SignedJwt;
import com.projectsale.entity.User;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Issues and verifies type-bound access and refresh JWTs signed with HS256. */
@Service
public class JwtService {

  private static final int MIN_SECRET_BYTES = 32;
  private static final String TYPE_CLAIM = "type";
  private static final String ROLE_CLAIM = "role";
  private static final String SESSION_ID_CLAIM = "sid";

  private final JwtProperties jwtProperties;
  private final byte[] secretKey;

  public JwtService(JwtProperties jwtProperties) {
    this.jwtProperties = jwtProperties;
    try {
      if (this.jwtProperties.secretBase64().isEmpty()) {
        throw new IllegalStateException("JWT_SECRET_BASE64 is not configured");
      }
      this.secretKey = Base64.getDecoder().decode(this.jwtProperties.secretBase64());
    } catch (Exception exception) {
      throw new IllegalStateException("JWT_SECRET_BASE64 must be valid base64", exception);
    }
    if (secretKey.length < MIN_SECRET_BYTES) {
      throw new IllegalStateException("JWT_SECRET_BASE64 must decode to at least 32 bytes");
    }
  }

  public String issueAccessToken(User user, UUID sessionId) {
    return issue(user, sessionId, TokenType.ACCESS, jwtProperties.accessTtl()).token();
  }

  // hàm sử dụng trong file refreshtoken dùng để tạo refresh token đã ký
  protected IssuedRefreshJwt createSignedRefreshJwt(User user, UUID sessionId) {
    SignedJwt issued = issue(user, sessionId, TokenType.REFRESH, jwtProperties.refreshTtl());
    return new IssuedRefreshJwt(issued.token(), issued.tokenId(), issued.expiresAt());
  }

  public AccessTokenClaims verifyAccessToken(String rawToken) {
    JWTClaimsSet claims = verify(rawToken, TokenType.ACCESS);
    try {
      return new AccessTokenClaims(
          UUID.fromString(claims.getSubject()),
          claims.getStringClaim(ROLE_CLAIM),
          UUID.fromString(claims.getStringClaim(SESSION_ID_CLAIM)),
          UUID.fromString(claims.getJWTID()),
          claims.getExpirationTime().toInstant());
    } catch (Exception exception) {
      throw new InvalidJwtException();
    }
  }

  public RefreshTokenClaims verifyRefreshToken(String rawToken) {
    JWTClaimsSet claims = verify(rawToken, TokenType.REFRESH);
    try {
      return new RefreshTokenClaims(
          UUID.fromString(claims.getSubject()),
          UUID.fromString(claims.getStringClaim(SESSION_ID_CLAIM)),
          UUID.fromString(claims.getJWTID()),
          claims.getExpirationTime().toInstant());
    } catch (Exception exception) {
      throw new InvalidJwtException();
    }
  }

  private SignedJwt issue(User user, UUID sessionId, TokenType type, Duration ttl) {
    if (user == null || user.getPublicId() == null || sessionId == null || ttl == null
        || ttl.isZero() || ttl.isNegative()) {
      throw new IllegalArgumentException("JWT issue arguments are invalid");
    }

    try {
      Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
      Instant expiresAt = now.plus(ttl);
      UUID tokenId = UUID.randomUUID();
      JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
          .subject(user.getPublicId().toString())
          .issuer(jwtProperties.issuer())
          .audience(jwtProperties.audience())
          .issueTime(Date.from(now))
          .expirationTime(Date.from(expiresAt))
          .jwtID(tokenId.toString())
          .claim(TYPE_CLAIM, type.name())
          .claim(SESSION_ID_CLAIM, sessionId.toString());
      if (type == TokenType.ACCESS) {
        if (user.getRole() == null) {
          throw new IllegalArgumentException("Access token requires a user role");
        }
        builder.claim(ROLE_CLAIM, user.getRole().name());
      }

      SignedJWT signedJwt = new SignedJWT(
          new JWSHeader.Builder(JWSAlgorithm.HS256).type(JOSEObjectType.JWT).build(),
          builder.build());
      signedJwt.sign(new MACSigner(secretKey));
      return new SignedJwt(signedJwt.serialize(), tokenId, expiresAt);
    } catch (JOSEException exception) {
      throw new IllegalStateException("Cannot sign JWT", exception);
    }
  }

  private JWTClaimsSet verify(String rawToken, TokenType expectedType) {
    try {
      SignedJWT signedJwt = SignedJWT.parse(rawToken);
      if (!JWSAlgorithm.HS256.equals(signedJwt.getHeader().getAlgorithm())
          || !signedJwt.verify(new MACVerifier(secretKey))) {
        throw new JOSEException("Invalid signature or algorithm");
      }

      JWTClaimsSet claims = signedJwt.getJWTClaimsSet();
      if (!claimsValid(claims)
          || !expectedType.name().equals(claims.getStringClaim(TYPE_CLAIM))) {
        throw new JOSEException("Invalid claims");
      }
      return claims;
    } catch (Exception exception) {
      throw new InvalidJwtException();
    }
  }

  private boolean claimsValid(JWTClaimsSet claims) {
    Instant now = Instant.now();
    Duration clockSkew = jwtProperties.clockSkew();
    return claims.getSubject() != null
        && claims.getJWTID() != null
        && claims.getIssueTime() != null
        && !claims.getIssueTime().toInstant().isAfter(now.plus(clockSkew))
        && jwtProperties.issuer().equals(claims.getIssuer())
        && claims.getAudience() != null
        && claims.getAudience().contains(jwtProperties.audience())
        && claims.getExpirationTime() != null
        && !claims.getExpirationTime().toInstant().plus(clockSkew).isBefore(now);
  }

  public enum TokenType {
    ACCESS,
    REFRESH
  }

  public static class InvalidJwtException extends RuntimeException {
    private static final long serialVersionUID = 1L;
  }
}
