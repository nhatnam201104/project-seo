package com.projectsale.api.auth.controller;

import static com.projectsale.api.auth.dto.AuthDtos.LoginRequest;
import static com.projectsale.api.auth.dto.AuthDtos.LogoutRequest;
import static com.projectsale.api.auth.dto.AuthDtos.RefreshRequest;
import static com.projectsale.api.auth.dto.AuthDtos.RefreshResponse;
import static com.projectsale.api.auth.dto.AuthDtos.RegisterRequest;
import static com.projectsale.api.auth.dto.AuthDtos.TokenResponse;
import static com.projectsale.api.auth.dto.AuthDtos.UserResponse;

import com.projectsale.api.auth.service.AuthService;
import com.projectsale.api.common.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/auth/register")
  ResponseEntity<ApiResponse<TokenResponse>> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(authService.register(request)));
  }

  @PostMapping("/auth/login")
  ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.ok(authService.login(request));
  }

  @PostMapping("/auth/refresh")
  ApiResponse<RefreshResponse> refresh(@Valid @RequestBody RefreshRequest request) {
    return ApiResponse.ok(authService.refresh(request));
  }

  @PostMapping("/auth/logout")
  ApiResponse<Void> logout(
      @AuthenticationPrincipal UUID userId, @Valid @RequestBody LogoutRequest request) {
    authService.logout(userId, request);
    return ApiResponse.ok(null);
  }

  @GetMapping("/me")
  ApiResponse<UserResponse> me(@AuthenticationPrincipal UUID userId) {
    return ApiResponse.ok(authService.me(userId));
  }
}
