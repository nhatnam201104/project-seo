package com.projectsale.api.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.projectsale.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class ProfileRequest {

  private ProfileRequest() {
  }

  /** PUT /users/me — phone và date_of_birth, gender có thể null (xóa giá trị). */
  public record Update(
      @JsonProperty("full_name") @NotBlank(message = "Họ tên không được để trống") @Size(max = 120, message = "Họ tên tối đa 120 ký tự") String fullName,

      @Pattern(regexp = "^(0|\\+84)(3|5|7|8|9)\\d{8}$", message = "Số điện thoại không hợp lệ") String phone,

      @JsonProperty("date_of_birth") @PastOrPresent(message = "Ngày sinh không hợp lệ") LocalDate dateOfBirth,

      Gender gender) {
  }

  public record ChangePassword(
      @JsonProperty("current_password") @NotBlank(message = "Mật khẩu hiện tại không được để trống") String currentPassword,

      @JsonProperty("new_password") @NotBlank(message = "Mật khẩu mới không được để trống") @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự") String newPassword) {
  }
}
