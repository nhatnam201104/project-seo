package com.projectsale.api.auth.security.oauth2;

import com.projectsale.api.auth.service.GoogleAccountProvisioner;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

/**
 * Vòng OAuth thất bại → redirect về trang login của SSR với một mã lỗi. Chỉ mã
 * trong whitelist mới được đưa lên URL; mọi lỗi kỹ thuật khác gộp thành
 * {@code oauth_failed} để không lộ chi tiết nội bộ.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

  /** {@code access_denied}: người dùng bấm huỷ ở màn hình đồng ý của Google. */
  static final Set<String> VISIBLE_ERRORS = Set.of(
      GoogleAccountProvisioner.EMAIL_NOT_VERIFIED,
      GoogleAccountProvisioner.ACCOUNT_DISABLED,
      GoogleAccountProvisioner.ACCOUNT_CONFLICT,
      "access_denied");

  private final OAuth2LoginProperties properties;

  @Override
  public void onAuthenticationFailure(
      HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
      throws IOException {
    String errorCode = exception instanceof OAuth2AuthenticationException oauth2
        ? oauth2.getError().getErrorCode()
        : null;
    log.warn("Google login failed: {}", errorCode == null ? exception.getClass().getSimpleName() : errorCode);
    OAuth2Redirects.endSession(request);
    // Set.of(...).contains(null) ném NPE → kiểm null trước.
    String visible = errorCode != null && VISIBLE_ERRORS.contains(errorCode)
        ? errorCode
        : OAuth2Redirects.OAUTH_FAILED;
    response.sendRedirect(OAuth2Redirects.loginError(properties.frontendBaseUrl(), visible));
  }
}
