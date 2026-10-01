package com.projectsale.api.auth.security.oauth2;

import com.projectsale.api.auth.service.OAuth2LoginCodeService;
import com.projectsale.common.exception.AppException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * Kết thúc vòng OAuth thành công: KHÔNG cấp token ở đây (backend không biết thiết
 * bị của trình duyệt), mà phát mã một lần gắn với {@code bind} rồi redirect về
 * callback của SSR. SSR đổi mã lấy token qua {@code /api/v1/auth/oauth2/exchange}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

  private final OAuth2LoginCodeService codeService;
  private final OAuth2LoginProperties properties;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException {
    String bind = boundNonce(request);
    OAuth2Redirects.endSession(request);
    SecurityContextHolder.clearContext();

    if (bind == null || !(authentication.getPrincipal() instanceof AppOidcUser user)) {
      log.warn("Google login finished without a bound browser nonce; rejecting");
      response.sendRedirect(OAuth2Redirects.loginError(
          properties.frontendBaseUrl(), OAuth2Redirects.OAUTH_FAILED));
      return;
    }
    String code;
    try {
      code = codeService.issue(user.getUserId(), bind);
    } catch (AppException exception) {
      response.sendRedirect(OAuth2Redirects.loginError(
          properties.frontendBaseUrl(), OAuth2Redirects.OAUTH_FAILED));
      return;
    }
    response.sendRedirect(OAuth2Redirects.callback(properties.frontendBaseUrl(), code));
  }

  private static String boundNonce(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session == null) {
      return null;
    }
    return session.getAttribute(BindingAuthorizationRequestResolver.BIND_SESSION_ATTRIBUTE)
        instanceof String bind ? bind : null;
  }
}
