package com.projectsale.common.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientRequestResolverTest {

  private static final String SECRET = "s".repeat(48);
  private static final String SSR_IP = "10.0.0.5";

  @Test
  void withoutAConfiguredSecretForwardedHeadersAreNeverTrusted() {
    ClientRequestResolver resolver = new ClientRequestResolver(new ProxyProperties(""));
    MockHttpServletRequest request = ssrRequest("", "203.0.113.10");

    assertThat(resolver.resolve(request))
        .isEqualTo(new ClientRequestInfo(SSR_IP, "axios/1.12.2"));
  }

  @Test
  void aWrongSecretIsIgnoredSoClientsCannotChooseTheirOwnRateLimitKey() {
    ClientRequestResolver resolver = new ClientRequestResolver(new ProxyProperties(SECRET));
    MockHttpServletRequest request = ssrRequest("x".repeat(48), "203.0.113.10");

    assertThat(resolver.resolve(request).ip()).isEqualTo(SSR_IP);
  }

  @Test
  void theTrustedSsrServerForwardsTheBrowserIpAndUserAgent() {
    ClientRequestResolver resolver = new ClientRequestResolver(new ProxyProperties(SECRET));
    MockHttpServletRequest request = ssrRequest(SECRET, "203.0.113.10");
    request.addHeader(ClientRequestResolver.FORWARDED_USER_AGENT, "Mozilla/5.0 (iPhone)");

    assertThat(resolver.resolve(request))
        .isEqualTo(new ClientRequestInfo("203.0.113.10", "Mozilla/5.0 (iPhone)"));
  }

  @Test
  void aTrustedRequestWithoutAForwardedUserAgentKeepsTheTransportOne() {
    ClientRequestResolver resolver = new ClientRequestResolver(new ProxyProperties(SECRET));

    assertThat(resolver.resolve(ssrRequest(SECRET, "2001:db8::1")))
        .isEqualTo(new ClientRequestInfo("2001:db8::1", "axios/1.12.2"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"", "203.0.113.10, 10.0.0.1", "evil.example", "1.2.3.4\r\nX: y",
      "::ffff:203.0.113.10:8080:extra:extra:extra:extra:extra"})
  void malformedForwardedAddressesFallBackToTheTransportAddress(String forwardedFor) {
    ClientRequestResolver resolver = new ClientRequestResolver(new ProxyProperties(SECRET));

    assertThat(resolver.resolve(ssrRequest(SECRET, forwardedFor)).ip()).isEqualTo(SSR_IP);
  }

  @Test
  void aConfiguredButWeakSecretFailsFastAtStartup() {
    assertThatThrownBy(() -> new ClientRequestResolver(new ProxyProperties("too-short")))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("INTERNAL_PROXY_SECRET");
  }

  private static MockHttpServletRequest ssrRequest(String secret, String forwardedFor) {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr(SSR_IP);
    request.addHeader("User-Agent", "axios/1.12.2");
    if (!secret.isEmpty()) {
      request.addHeader(ClientRequestResolver.PROXY_SECRET, secret);
    }
    request.addHeader(ClientRequestResolver.FORWARDED_FOR, forwardedFor);
    return request;
  }
}
