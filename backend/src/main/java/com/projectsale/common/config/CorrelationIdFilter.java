package com.projectsale.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Gắn correlation id cho mỗi request: lấy từ header {@code X-Correlation-Id}
 * nếu có,
 * ngược lại sinh mới. Lưu vào request attribute (cho log/lỗi) và echo lại qua
 * response header.
 */
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

  public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
  public static final String CORRELATION_ID_ATTRIBUTE = "correlationId";

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String correlationId = request.getHeader(CORRELATION_ID_HEADER);
    if (correlationId == null || correlationId.isBlank()) {
      correlationId = UUID.randomUUID().toString();
    }
    request.setAttribute(CORRELATION_ID_ATTRIBUTE, correlationId);
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    filterChain.doFilter(request, response);
  }
}
