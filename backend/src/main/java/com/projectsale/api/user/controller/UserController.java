package com.projectsale.api.user.controller;

import com.projectsale.api.user.dto.ProfileRequest;
import com.projectsale.api.user.dto.ProfileResponse;
import com.projectsale.api.user.service.UserProfileService;
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
  public ApiResponse<ProfileResponse> getProfile(@AuthenticationPrincipal UUID userId) {
    return ApiResponse.ok(profileService.get(userId));
  }

  @PutMapping
  public ApiResponse<ProfileResponse> updateProfile(
      @AuthenticationPrincipal UUID userId, @Valid @RequestBody ProfileRequest.Update request) {
    return ApiResponse.ok(profileService.update(userId, request));
  }

  @PostMapping("/password")
  public ApiResponse<Void> changePassword(
      @AuthenticationPrincipal UUID userId, @Valid @RequestBody ProfileRequest.ChangePassword request) {
    profileService.changePassword(userId, request);
    return ApiResponse.ok(null);
  }
}
