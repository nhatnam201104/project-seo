package com.projectsale.api.auth.controller;

import com.projectsale.api.auth.dto.AuthRequest.LoginRequest;
import com.projectsale.api.auth.dto.AuthRequest.LogoutRequest;
import com.projectsale.api.auth.dto.AuthRequest.RefreshRequest;
import com.projectsale.api.auth.dto.AuthRequest.RegisterRequest;
import com.projectsale.api.auth.dto.AuthRequest.ResendOTP;
import com.projectsale.api.auth.dto.AuthRequest.VerifyRequest;
import com.projectsale.api.auth.dto.AuthResponse.TokenPair;
import com.projectsale.api.auth.dto.AuthResponse.TokenResponse;
import com.projectsale.api.auth.dto.AuthResponse.UserResponse;
import com.projectsale.api.auth.service.AuthService;
import com.projectsale.common.device.DeviceInfoFactory;
import com.projectsale.common.rateLimit.RateLimit;
import com.projectsale.common.rateLimit.RateLimit.KeyType;
import com.projectsale.common.response.ApiResponse;
import com.projectsale.common.web.ClientRequestResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Rate limit: theo IP chặn một client spam nhiều tài khoản; theo email bảo vệ một
 * tài khoản khỏi kẻ tấn công xoay vòng IP. IP là IP thật của trình duyệt do
 * {@link ClientRequestResolver} xác định, không phải IP của server SSR.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final ClientRequestResolver clientResolver;

    @RateLimit(limit = 20, duration = 15, keyType = KeyType.IP_ADDRESS)
    @RateLimit(limit = 10, duration = 15, keyType = KeyType.EMAIL)
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        var deviceInfo = DeviceInfoFactory.from(
                request.deviceId(), request.deviceName(), request.platform(),
                clientResolver.resolve(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request, deviceInfo)));
    }

    @RateLimit(limit = 5, duration = 15, keyType = KeyType.IP_ADDRESS)
    @RateLimit(limit = 3, duration = 15, keyType = KeyType.EMAIL)
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(null));
    }

    @RateLimit(limit = 20, duration = 15, keyType = KeyType.IP_ADDRESS)
    @RateLimit(limit = 5, duration = 15, keyType = KeyType.EMAIL)
    @PostMapping("/verify")
    public ApiResponse<TokenResponse> verify(
            @Valid @RequestBody VerifyRequest request,
            HttpServletRequest httpRequest) {
        var deviceInfo = DeviceInfoFactory.from(
                request.deviceId(), request.deviceName(), request.platform(),
                clientResolver.resolve(httpRequest));
        return ApiResponse.ok(authService.verify(request, deviceInfo));
    }

    @RateLimit(limit = 10, duration = 15, keyType = KeyType.IP_ADDRESS)
    // Khớp cooldown 300 giây ở frontend; chặn việc gửi lại liên tục để reset số lần đoán OTP.
    @RateLimit(limit = 1, duration = 5, keyType = KeyType.EMAIL)
    @PostMapping("/resendOTP")
    public ApiResponse<Void> resendOTP(@Valid @RequestBody ResendOTP request) {
        authService.resendOTP(request.email());
        return ApiResponse.ok(null);
    }

    @RateLimit(limit = 30, duration = 1, keyType = KeyType.IP_ADDRESS)
    @PostMapping("/refresh")
    public ApiResponse<TokenPair> refresh(
            @Valid @RequestBody RefreshRequest request,
            HttpServletRequest httpRequest) {
        var activity = DeviceInfoFactory.activityFrom(clientResolver.resolve(httpRequest));
        return ApiResponse.ok(authService.refresh(request, activity));
    }

    @PostMapping("/me")
    public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(authService.getMe(userId));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody @Valid LogoutRequest request) {
        authService.logout(request);
        return ApiResponse.ok(null);
    }

}
