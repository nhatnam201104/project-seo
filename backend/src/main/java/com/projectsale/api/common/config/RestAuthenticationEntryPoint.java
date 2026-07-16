package com.projectsale.api.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectsale.api.common.exception.ErrorCode;
import com.projectsale.api.common.response.ApiError;
import com.projectsale.api.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Trả lỗi 401 theo đúng envelope chuẩn hoá khi request chưa xác thực chạm vào
 * endpoint được bảo vệ. Tách riêng khỏi {@link SecurityConfig} để dễ đọc và tái
 * sử dụng.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authenticationException)
      throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    ApiResponse<Void> body = ApiResponse.error(ApiError.of(ErrorCode.UNAUTHORIZED.defaultMessage()));
    objectMapper.writeValue(response.getWriter(), body);
  }
}
