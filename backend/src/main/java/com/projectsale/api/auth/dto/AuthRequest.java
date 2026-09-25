package com.projectsale.api.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.projectsale.api.auth.security.dto.DevicePlatform;
import com.projectsale.common.rateLimit.EmailKeyed;
import com.projectsale.common.validate.phone.ValidPhone;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class AuthRequest {

        private AuthRequest() {
        }

        public record RegisterRequest(
                        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") @Size(max = 190, message = "Email tối đa 190 ký tự") String email,

                        @NotBlank(message = "Mật khẩu không được để trống") @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự") String password,

                        @JsonProperty("full_name") @NotBlank(message = "Họ tên không được để trống") @Size(max = 120, message = "Họ tên tối đa 120 ký tự") String fullName,

                        @NotBlank(message = "Số điện thoại không được để trống") @ValidPhone(message = "Số điện thoại không hợp lệ") String phone) implements EmailKeyed {
        }

        public record LoginRequest(
                        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,
                        @NotNull(message = "Thiếu device ID") UUID deviceId,

                        @Size(max = 120, message = "Tên thiết bị tối đa 120 ký tự") String deviceName,

                        DevicePlatform platform,

                        @NotBlank(message = "Mật khẩu không được để trống") String password) implements EmailKeyed {
        }

        public record RefreshRequest(
                        @JsonProperty("refresh_token") @NotBlank(message = "Thiếu refresh token") String refreshToken) {
        }

        public record LogoutRequest(
                        @JsonProperty("refresh_token") @NotBlank(message = "Thiếu refresh token") String refreshToken,
                        @NotNull(message = "Thiếu device ID") UUID deviceId) {
        }

        public record VerifyRequest(
                        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,

                        @NotBlank(message = "OTP không được để trống") @Size(min = 6, max = 6, message = "OTP không đúng định dạng") String otp,

                        @NotNull(message = "Thiếu device ID") UUID deviceId,

                        @Size(max = 120, message = "Tên thiết bị tối đa 120 ký tự") String deviceName,

                        DevicePlatform platform) implements EmailKeyed {
        }

        public record AccessRequest(
                        @JsonProperty("access_token") @NotBlank(message = "Thiếu access token") String accessToken) {
        }

        public record ResendOTP(
                        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email) implements EmailKeyed {
        }

}
