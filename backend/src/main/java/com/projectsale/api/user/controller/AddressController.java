package com.projectsale.api.user.controller;

import com.projectsale.api.user.dto.UserRequest;
import com.projectsale.api.user.dto.UserResponse;
import com.projectsale.api.user.service.AddressService;
import com.projectsale.common.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/addresses")
@RequiredArgsConstructor
public class AddressController {

  private final AddressService addressService;

  @GetMapping
  public ApiResponse<List<UserResponse.Address>> list(@AuthenticationPrincipal UUID userId) {
    return ApiResponse.ok(addressService.list(userId));
  }

  @GetMapping("/{id}")
  public ApiResponse<UserResponse.Address> get(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
    return ApiResponse.ok(addressService.get(userId, id));
  }

  @PostMapping
  public ResponseEntity<ApiResponse<UserResponse.Address>> create(
      @AuthenticationPrincipal UUID userId, @Valid @RequestBody UserRequest.SaveAddress request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.ok(addressService.create(userId, request)));
  }

  @PutMapping("/{id}")
  public ApiResponse<UserResponse.Address> update(
      @AuthenticationPrincipal UUID userId, @PathVariable UUID id, @Valid @RequestBody UserRequest.SaveAddress request) {
    return ApiResponse.ok(addressService.update(userId, id, request));
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> delete(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
    addressService.delete(userId, id);
    return ApiResponse.ok(null);
  }

  @PostMapping("/{id}/default")
  public ApiResponse<Void> makeDefault(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
    addressService.makeDefault(userId, id);
    return ApiResponse.ok(null);
  }
}
