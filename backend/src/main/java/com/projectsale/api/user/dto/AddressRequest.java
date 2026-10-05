package com.projectsale.api.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body POST/PUT /users/me/addresses — khớp {@code AddressInput} ở frontend. */
public record AddressRequest(
    @JsonProperty("receiver_name") @NotBlank(message = "Tên người nhận không được để trống") @Size(max = 120, message = "Tên người nhận tối đa 120 ký tự") String receiverName,

    @JsonProperty("receiver_phone") @NotBlank(message = "Số điện thoại không được để trống") @Pattern(regexp = "^(0|\\+84)(3|5|7|8|9)\\d{8}$", message = "Số điện thoại không hợp lệ") String receiverPhone,

    @NotBlank(message = "Số nhà, tên đường không được để trống") @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String line,

    @NotBlank(message = "Phường / xã không được để trống") @Size(max = 120, message = "Phường / xã tối đa 120 ký tự") String ward,

    @NotBlank(message = "Quận / huyện không được để trống") @Size(max = 120, message = "Quận / huyện tối đa 120 ký tự") String district,

    @NotBlank(message = "Tỉnh / thành phố không được để trống") @Size(max = 120, message = "Tỉnh / thành phố tối đa 120 ký tự") String city,

    @JsonProperty("is_default") boolean isDefault) {
}
