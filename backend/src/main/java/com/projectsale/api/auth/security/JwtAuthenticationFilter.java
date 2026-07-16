package com.projectsale.api.auth.security;

import com.projectsale.api.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Đọc Bearer token, xác minh và nạp danh tính vào {@link SecurityContextHolder}.
 * Token sai/hết hạn → bỏ qua (giữ context rỗng); quyết định 401 để cho entry point xử lý.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtService jwtService;
  private final UserRepository userRepository;

  public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
    this.jwtService = jwtService;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (authorizationHeader != null && authorizationHeader.startsWith(BEARER_PREFIX)) {
      authenticate(authorizationHeader.substring(BEARER_PREFIX.length()));
    }
    filterChain.doFilter(request, response);
  }

  private void authenticate(String token) {
    try {
      JwtService.Claims claims = jwtService.verify(token);
      var user =
          userRepository
              .findByPublicId(claims.userId())
              .filter(
                  candidate ->
                      candidate.isActive() && candidate.getRole().name().equals(claims.role()))
              .orElseThrow();
      var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
      var authentication =
          new UsernamePasswordAuthenticationToken(
              user.getPublicId(), null, List.of(authority));
      SecurityContextHolder.getContext().setAuthentication(authentication);
    } catch (Exception e) {
      SecurityContextHolder.clearContext();
    }
  }
}
