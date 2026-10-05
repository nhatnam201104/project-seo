package com.projectsale.api.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.projectsale.common.validate.phone.ValidPhone;
import com.projectsale.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Body request của người dùng đã đăng nhập (hồ sơ, mật khẩu, địa chỉ). */
public class UserRequest {

  private UserRequest() {
  }

  /** PUT /users/me — phone, date_of_birth, gender có thể null (xóa giá trị). */
  public record UpdateProfile(
      @JsonProperty("full_name") @NotBlank(message = "Họ tên không được để trống") @Size(max = 120, message = "Họ tên tối đa 120 ký tự") String fullName,

      @ValidPhone(nullable = true, message = "Số điện thoại không hợp lệ") String phone,

      @JsonProperty("date_of_birth") @PastOrPresent(message = "Ngày sinh không hợp lệ") LocalDate dateOfBirth,

      Gender gender) {
  }

  /** POST /users/me/password — độ dài mật khẩu mới khớp {@code RegisterRequest}. */
  public record ChangePassword(
      @JsonProperty("current_password") @NotBlank(message = "Mật khẩu hiện tại không được để trống") String currentPassword,

      @JsonProperty("new_password") @NotBlank(message = "Mật khẩu mới không được để trống") @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự") String newPassword) {
  }

  /** POST/PUT /users/me/addresses. */
  public record SaveAddress(
      @JsonProperty("receiver_name") @NotBlank(message = "Tên người nhận không được để trống") @Size(max = 120, message = "Tên người nhận tối đa 120 ký tự") String receiverName,

      @JsonProperty("receiver_phone") @NotBlank(message = "Số điện thoại không được để trống") @ValidPhone(message = "Số điện thoại không hợp lệ") String receiverPhone,

      @NotBlank(message = "Số nhà, tên đường không được để trống") @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String line,

      @NotBlank(message = "Phường / xã không được để trống") @Size(max = 120, message = "Phường / xã tối đa 120 ký tự") String ward,

      @NotBlank(message = "Quận / huyện không được để trống") @Size(max = 120, message = "Quận / huyện tối đa 120 ký tự") String district,

      @NotBlank(message = "Tỉnh / thành phố không được để trống") @Size(max = 120, message = "Tỉnh / thành phố tối đa 120 ký tự") String city,

      @JsonProperty("is_default") boolean isDefault) {
  }
}
