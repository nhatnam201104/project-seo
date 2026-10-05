package com.projectsale.api.user.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.projectsale.enums.Gender;
import java.time.LocalDate;
import java.util.UUID;

/** Response của người dùng đã đăng nhập; khớp kiểu {@code Profile}/{@code Address} ở frontend. */
public class UserResponse {

  private UserResponse() {
  }

  public record Profile(
      UUID id,
      String email,
      @JsonProperty("full_name") String fullName,
      String phone,
      @JsonProperty("date_of_birth") @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate dateOfBirth,
      Gender gender,
      @JsonProperty("avatar_url") String avatarUrl) {
  }

  /** {@code id} là public id. */
  public record Address(
      UUID id,
      @JsonProperty("receiver_name") String receiverName,
      @JsonProperty("receiver_phone") String receiverPhone,
      String line,
      String ward,
      String district,
      String city,
      @JsonProperty("is_default") boolean isDefault) {
  }
}
