package com.projectsale.api.auth.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.util.UriComponentsBuilder;

/** Đích redirect về frontend SSR khi kết thúc vòng OAuth. */
final class OAuth2Redirects {

  static final String OAUTH_FAILED = "oauth_failed";

  private static final String CALLBACK_PATH = "/auth/google/callback";
  private static final String LOGIN_PATH = "/login";

  private OAuth2Redirects() {}

  static String callback(String frontendBaseUrl, String code) {
    return UriComponentsBuilder.fromUriString(frontendBaseUrl)
        .path(CALLBACK_PATH)
        .queryParam("code", code)
        .encode()
        .toUriString();
  }

  static String loginError(String frontendBaseUrl, String errorCode) {
    return UriComponentsBuilder.fromUriString(frontendBaseUrl)
        .path(LOGIN_PATH)
        .queryParam("oauth_error", errorCode)
        .encode()
        .toUriString();
  }

  /** HttpSession chỉ dùng để giữ state OAuth trong một vòng đăng nhập; huỷ ngay khi xong. */
  static void endSession(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session != null) {
      session.invalidate();
    }
  }
}
