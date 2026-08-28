package com.projectsale.api.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.projectsale.api.auth.security.dto.AccessTokenClaims;
import com.projectsale.api.auth.security.dto.IssuedRefreshJwt;
import com.projectsale.api.auth.security.dto.RefreshTokenClaims;
import com.projectsale.entity.User;
import com.projectsale.enums.RolesEnum;
import java.time.Duration;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

  @Test
  void issuesAndVerifiesAccessClaimsOnlyAsAccessToken() {
    JwtService service = service();
    User user = user();
    UUID sessionId = UUID.randomUUID();

    String token = service.issueAccessToken(user, sessionId);
    AccessTokenClaims claims = service.verifyAccessToken(token);

    assertThat(claims.userId()).isEqualTo(user.getPublicId());
    assertThat(claims.role()).isEqualTo("USER");
    assertThat(claims.sessionId()).isEqualTo(sessionId);
    assertThatThrownBy(() -> service.verifyRefreshToken(token))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  @Test
  void issuesAndVerifiesRefreshClaimsOnlyAsRefreshToken() {
    JwtService service = service();
    User user = user();
    UUID sessionId = UUID.randomUUID();

    IssuedRefreshJwt issued = service.createSignedRefreshJwt(user, sessionId);
    RefreshTokenClaims claims = service.verifyRefreshToken(issued.token());

    assertThat(claims.userId()).isEqualTo(user.getPublicId());
    assertThat(claims.sessionId()).isEqualTo(sessionId);
    assertThat(claims.tokenId()).isEqualTo(issued.tokenId());
    assertThat(claims.expiresAt()).isEqualTo(issued.expiresAt());
    assertThatThrownBy(() -> service.verifyAccessToken(issued.token()))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  @Test
  void rejectsTamperedSignature() {
    JwtService service = service();
    String token = service.issueAccessToken(user(), UUID.randomUUID());
    // Mutate a decoded signature byte, not unused bits in the final Base64URL character.
    String[] parts = token.split("\\.");
    byte[] signature = Base64.getUrlDecoder().decode(parts[2]);
    signature[0] ^= 1;
    String tampered = parts[0] + "." + parts[1] + "."
        + Base64.getUrlEncoder().withoutPadding().encodeToString(signature);

    assertThatThrownBy(() -> service.verifyAccessToken(tampered))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  @Test
  void rejectsTokenIssuedForDifferentAudience() {
    String secret = Base64.getEncoder().encodeToString(new byte[32]);
    JwtService issuer = service(secret, "projectsale-web");
    JwtService otherAudience = service(secret, "another-client");
    String token = issuer.issueAccessToken(user(), UUID.randomUUID());

    assertThatThrownBy(() -> otherAudience.verifyAccessToken(token))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  @Test
  void rejectsWeakOrMalformedSecretAtStartup() {
    String weak = Base64.getEncoder().encodeToString(new byte[16]);

    assertThatThrownBy(() -> service(weak, "projectsale-web"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("at least 32 bytes");
    assertThatThrownBy(() -> service("not-base64", "projectsale-web"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("valid base64");
  }

  @Test
  void rejectsAccessTokenIssueWithoutRoleOrSession() {
    User noRole = mock(User.class);
    when(noRole.getPublicId()).thenReturn(UUID.randomUUID());

    assertThatThrownBy(() -> service().issueAccessToken(noRole, UUID.randomUUID()))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("user role");
    assertThatThrownBy(() -> service().issueAccessToken(user(), null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("arguments are invalid");
  }

  @Test
  void doesNotWriteSigningSecretToStandardOutput() {
    // Synthetic, test-only fixture. Never load application.yml or environment secrets.
    String fixture = "TEST-ONLY-KEY-NEVER-USE-IN-PROD-123456";
    ByteArrayOutputStream captured = new ByteArrayOutputStream();
    PrintStream original = System.out;
    try (PrintStream replacement = new PrintStream(captured, true, StandardCharsets.UTF_8)) {
      System.setOut(replacement);
      service(Base64.getEncoder().encodeToString(fixture.getBytes(StandardCharsets.UTF_8)),
          "projectsale-web");
    } finally {
      System.setOut(original);
    }
    assertThat(captured.toString(StandardCharsets.UTF_8).contains(fixture))
        .as("Signing key material must never be printed")
        .isFalse();
  }

  @Test
  void rejectsMissingSecretAtStartup() {
    assertThatThrownBy(() -> service("", "projectsale-web"))
        .isInstanceOf(IllegalStateException.class);
  }

  @Test
  void rejectsExpiredTokenBeyondClockSkew() throws Exception {
    assertThatThrownBy(() -> service().verifyAccessToken(signedToken(
        "projectsale-api", Instant.now().minusSeconds(600), Instant.now().minusSeconds(120))))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  @Test
  void rejectsFutureIssuedAtBeyondClockSkew() throws Exception {
    assertThatThrownBy(() -> service().verifyAccessToken(signedToken(
        "projectsale-api", Instant.now().plusSeconds(120), Instant.now().plusSeconds(900))))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  @Test
  void rejectsDifferentIssuer() throws Exception {
    assertThatThrownBy(() -> service().verifyAccessToken(signedToken(
        "another-issuer", Instant.now(), Instant.now().plusSeconds(900))))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  @Test
  void rejectsMalformedToken() {
    assertThatThrownBy(() -> service().verifyAccessToken("not.a.jwt"))
        .isInstanceOf(JwtService.InvalidJwtException.class);
  }

  private static String signedToken(String issuer, Instant issuedAt, Instant expiresAt)
      throws Exception {
    SignedJWT token = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256),
        new JWTClaimsSet.Builder().subject(UUID.randomUUID().toString())
            .issuer(issuer).audience("projectsale-web").issueTime(Date.from(issuedAt))
            .expirationTime(Date.from(expiresAt)).jwtID(UUID.randomUUID().toString())
            .claim("type", "ACCESS").claim("role", "USER")
            .claim("sid", UUID.randomUUID().toString()).build());
    token.sign(new MACSigner(new byte[32]));
    return token.serialize();
  }

  private static JwtService service() {
    return service(Base64.getEncoder().encodeToString(new byte[32]), "projectsale-web");
  }

  private static JwtService service(String secret, String audience) {
    return new JwtService(new JwtProperties(
        secret,
        "projectsale-api",
        audience,
        Duration.ofMinutes(15),
        Duration.ofDays(30),
        Duration.ofSeconds(60)));
  }

  private static User user() {
    User user = mock(User.class);
    when(user.getPublicId()).thenReturn(UUID.randomUUID());
    when(user.getRole()).thenReturn(RolesEnum.USER);
    return user;
  }
}
