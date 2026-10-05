package com.projectsale.api.user.controller;

import com.projectsale.api.user.dto.UserRequest;
import com.projectsale.api.user.dto.UserResponse;
import com.projectsale.api.user.service.UserProfileService;
import com.projectsale.common.rateLimit.RateLimit;
import com.projectsale.common.rateLimit.RateLimit.KeyType;
import com.projectsale.common.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

  private final UserProfileService profileService;

  @GetMapping
  public ApiResponse<UserResponse.Profile> getProfile(@AuthenticationPrincipal UUID userId) {
    return ApiResponse.ok(profileService.get(userId));
  }

  @PutMapping
  public ApiResponse<UserResponse.Profile> updateProfile(
      @AuthenticationPrincipal UUID userId, @Valid @RequestBody UserRequest.UpdateProfile request) {
    return ApiResponse.ok(profileService.update(userId, request));
  }

  /** Chặn dò mật khẩu hiện tại bằng access token bị lộ. */
  @RateLimit(limit = 5, duration = 15, keyType = KeyType.IP_ADDRESS)
  @PostMapping("/password")
  public ApiResponse<Void> changePassword(
      @AuthenticationPrincipal UUID userId, @Valid @RequestBody UserRequest.ChangePassword request) {
    profileService.changePassword(userId, request);
    return ApiResponse.ok(null);
  }
}
