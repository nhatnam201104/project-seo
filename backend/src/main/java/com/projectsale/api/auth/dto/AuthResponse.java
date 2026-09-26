package com.projectsale.api.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.projectsale.enums.RolesEnum;

import lombok.Builder;

import java.util.UUID;

@Builder
public class AuthResponse {

  private AuthResponse() {}

  public record UserResponse(
      UUID id,
      String email,
      @JsonProperty("full_name") String fullName,
      String phone,
      RolesEnum role) {}

      
  public record TokenResponse(
      @JsonProperty("access_token") String accessToken,
      @JsonProperty("refresh_token") String refreshToken,
      UserResponse user) {}

  public record TokenPair(
      @JsonProperty("access_token") String accessToken,
      @JsonProperty("refresh_token") String refreshToken) {}
}
