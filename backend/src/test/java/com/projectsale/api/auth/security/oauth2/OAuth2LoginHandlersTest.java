package com.projectsale.api.auth.security.oauth2;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.projectsale.api.auth.service.GoogleAccountProvisioner;
import com.projectsale.api.auth.service.OAuth2LoginCodeService;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;

class OAuth2LoginHandlersTest {

  private static final String FRONTEND = "https://shop.example.com";
  private static final String BIND = "b".repeat(43);

  private OAuth2LoginCodeService codeService;
  private OAuth2LoginSuccessHandler successHandler;
  private OAuth2LoginFailureHandler failureHandler;
  private MockHttpServletRequest request;
  private MockHttpSession session;
  private MockHttpServletResponse response;

  @BeforeEach
  void setUp() {
    codeService = mock(OAuth2LoginCodeService.class);
    OAuth2LoginProperties properties = new OAuth2LoginProperties(FRONTEND + "/");
    successHandler = new OAuth2LoginSuccessHandler(codeService, properties);
    failureHandler = new OAuth2LoginFailureHandler(properties);
    session = new MockHttpSession();
    request = new MockHttpServletRequest();
    request.setSession(session);
    response = new MockHttpServletResponse();
  }

  @Test
  void successRedirectsToSsrCallbackWithOneTimeCodeAndEndsTheSession() throws Exception {
    UUID userId = UUID.randomUUID();
    session.setAttribute(BindingAuthorizationRequestResolver.BIND_SESSION_ATTRIBUTE, BIND);
    when(codeService.issue(userId, BIND)).thenReturn("one-time-code");

    successHandler.onAuthenticationSuccess(request, response, authentication(userId));

    assertThat(response.getRedirectedUrl())
        .isEqualTo(FRONTEND + "/auth/google/callback?code=one-time-code");
    assertThat(session.isInvalid()).isTrue();
  }

  @Test
  void successWithoutBoundNonceIsRejectedWithoutIssuingACode() throws Exception {
    successHandler.onAuthenticationSuccess(request, response, authentication(UUID.randomUUID()));

    assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?oauth_error=oauth_failed");
    verifyNoInteractions(codeService);
  }

  @Test
  void successWithUnexpectedPrincipalIsRejected() throws Exception {
    session.setAttribute(BindingAuthorizationRequestResolver.BIND_SESSION_ATTRIBUTE, BIND);

    successHandler.onAuthenticationSuccess(request, response,
        new TestingAuthenticationToken("someone", null));

    assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?oauth_error=oauth_failed");
    verifyNoInteractions(codeService);
  }

  @Test
  void successMapsRedisFailureToGenericLoginError() throws Exception {
    session.setAttribute(BindingAuthorizationRequestResolver.BIND_SESSION_ATTRIBUTE, BIND);
    when(codeService.issue(any(), any())).thenThrow(new AppException(ErrorCode.REDIS_ERROR));

    successHandler.onAuthenticationSuccess(request, response, authentication(UUID.randomUUID()));

    assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?oauth_error=oauth_failed");
    assertThat(session.isInvalid()).isTrue();
  }

  @Test
  void failureExposesWhitelistedErrorCodes() throws Exception {
    for (String code : List.of(GoogleAccountProvisioner.ACCOUNT_DISABLED,
        GoogleAccountProvisioner.EMAIL_NOT_VERIFIED, GoogleAccountProvisioner.ACCOUNT_CONFLICT,
        "access_denied")) {
      MockHttpServletResponse failureResponse = new MockHttpServletResponse();

      failureHandler.onAuthenticationFailure(request, failureResponse,
          new OAuth2AuthenticationException(new OAuth2Error(code)));

      assertThat(failureResponse.getRedirectedUrl())
          .isEqualTo(FRONTEND + "/login?oauth_error=" + code);
    }
  }

  @Test
  void failureHidesInternalErrorsAndEndsTheSession() throws Exception {
    failureHandler.onAuthenticationFailure(request, response,
        new OAuth2AuthenticationException(new OAuth2Error("invalid_id_token", "details", null)));

    assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?oauth_error=oauth_failed");
    assertThat(session.isInvalid()).isTrue();
  }

  @Test
  void failureOfNonOAuthExceptionIsGeneric() throws Exception {
    failureHandler.onAuthenticationFailure(request, response, new BadCredentialsException("x"));

    assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?oauth_error=oauth_failed");
  }

  private static TestingAuthenticationToken authentication(UUID userId) {
    OidcIdToken idToken = new OidcIdToken("id-token", Instant.now(),
        Instant.now().plusSeconds(60), Map.of("sub", "google-subject"));
    AppOidcUser principal = new AppOidcUser(
        userId, List.of(new SimpleGrantedAuthority("ROLE_USER")), idToken, null);
    return new TestingAuthenticationToken(principal, null, List.of());
  }
}
