package com.projectsale.api.auth.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import java.util.regex.Pattern;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * Bắt đầu vòng OAuth với Google: thêm PKCE (nonce OIDC đã có sẵn) và bắt buộc
 * tham số {@code bind} — nonce do SSR đặt trong cookie của trình duyệt khởi
 * tạo.
 * {@code bind} được giữ trong HttpSession để success handler gắn vào mã trao
 * tay.
 *
 * <p>
 * Thiếu hoặc sai định dạng {@code bind} → trả {@code null}: request không được
 * chuyển sang Google và rơi xuống entry point (401).
 */
public class BindingAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

  public static final String BIND_PARAMETER = "bind";
  public static final String BIND_SESSION_ATTRIBUTE = BindingAuthorizationRequestResolver.class.getName() + ".BIND";

  /** 32 byte ngẫu nhiên mã hoá base64url không padding. */
  private static final Pattern BIND_FORMAT = Pattern.compile("^[A-Za-z0-9_-]{43}$");

  private final DefaultOAuth2AuthorizationRequestResolver delegate;

  public BindingAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
    this.delegate = new DefaultOAuth2AuthorizationRequestResolver(
        clientRegistrationRepository,
        OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI);
    this.delegate.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
  }

  @Override
  public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
    return bind(request, delegate.resolve(request));
  }

  @Override
  public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
    return bind(request, delegate.resolve(request, clientRegistrationId));
  }

  private static OAuth2AuthorizationRequest bind(
      HttpServletRequest request, OAuth2AuthorizationRequest authorizationRequest) {
    if (authorizationRequest == null) {
      return null;
    }
    String bind = request.getParameter(BIND_PARAMETER);
    if (bind == null || !BIND_FORMAT.matcher(bind).matches()) {
      return null;
    }
    request.getSession().setAttribute(BIND_SESSION_ATTRIBUTE, bind);
    return authorizationRequest;
  }
}
