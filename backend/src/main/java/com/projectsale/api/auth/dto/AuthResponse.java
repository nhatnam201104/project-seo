package com.projectsale.api.auth.dto;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthResponse {
        private AuthResponse() {
        }

        public record UserResponse(
                        UUID id,
                        String email,
                        @JsonProperty("full_name") String fullName,
                        String phone,
                        String role) {
        }

        public record TokenResponse(
                        @JsonProperty("access_token") String accessToken,
                        @JsonProperty("refresh_token") String refreshToken,
                        UserResponse user) {
        }

        public record RefreshResponse(
                        @JsonProperty("access_token") String accessToken,
                        @JsonProperty("refresh_token") String refreshToken) {
        }
}
