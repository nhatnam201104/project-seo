package com.projectsale.api.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.projectsale.api.auth.dto.AuthRequest.RegisterRequest;
import com.projectsale.api.auth.dto.AuthResponse.TokenResponse;
import com.projectsale.api.auth.service.AuthService;
import com.projectsale.common.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/register")
    ResponseEntity<ApiResponse<TokenResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info(request.toString());
        var val = authService.Register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(null);
    }

    // @PostMapping("/auth/login")
    // ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
    // return ApiResponse.ok(authService.login(request));
    // }

    // @PostMapping("/auth/refresh")
    // ApiResponse<RefreshResponse> refresh(@Valid @RequestBody RefreshRequest
    // request) {
    // return ApiResponse.ok(authService.refresh(request));
    // }

    // @PostMapping("/auth/logout")
    // ApiResponse<Void> logout(
    // @AuthenticationPrincipal UUID userId, @Valid @RequestBody LogoutRequest
    // request) {
    // authService.logout(userId, request);
    // return ApiResponse.ok(null);
    // }

    // @GetMapping("/me")
    // ApiResponse<UserResponse> me(@AuthenticationPrincipal UUID userId) {
    // return ApiResponse.ok(authService.me(userId));
    // }
    // }
}