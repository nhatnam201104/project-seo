package com.projectsale.api.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO request/response cho Auth. Body giữ quy ước snake_case theo contract hiện
 * có.
 */
public final class AuthDtos {

        private AuthDtos() {
        }

        public record RegisterRequest(
                        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") @Size(max = 190, message = "Email tối đa 190 ký tự") String email,
                        @NotBlank(message = "Mật khẩu không được để trống") @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự") String password,
                        @JsonProperty("full_name") @NotBlank(message = "Họ tên không được để trống") @Size(max = 120, message = "Họ tên tối đa 120 ký tự") String fullName,
                        @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự") String phone) {
        }

        public record LoginRequest(
                        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,
                        @NotBlank(message = "Mật khẩu không được để trống") String password) {
        }

        public record RefreshRequest(
                        @JsonProperty("refresh_token") @NotBlank(message = "Thiếu refresh token") String refreshToken) {
        }

        public record LogoutRequest(
                        @JsonProperty("refresh_token") @NotBlank(message = "Thiếu refresh token") String refreshToken) {
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
