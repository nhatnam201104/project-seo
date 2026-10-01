package com.projectsale.api.auth.security.oauth2;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình đăng nhập Google (prefix {@code app.oauth2}).
 *
 * @param frontendBaseUrl origin công khai của frontend SSR; backend redirect trình
 *                        duyệt về đây sau callback OAuth (thành công hay thất bại).
 */
@ConfigurationProperties("app.oauth2")
public record OAuth2LoginProperties(String frontendBaseUrl) {

  public OAuth2LoginProperties {
    if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
      throw new IllegalStateException("app.oauth2.frontend-base-url (FRONTEND_BASE_URL) is required");
    }
    frontendBaseUrl = frontendBaseUrl.endsWith("/")
        ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
        : frontendBaseUrl;
  }
}
