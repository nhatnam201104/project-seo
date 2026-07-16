package com.projectsale.api.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Khối lỗi bên trong envelope chuẩn hoá.
 *
 * <pre>{@code
 * { "message": "...", "detailMessage": "..." }
 * }</pre>
 *
 * {@code detailMessage} chỉ xuất hiện khi có giá trị (chi tiết kỹ thuật tuỳ
 * chọn).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(String message, String detailMessage) {

  public static ApiError of(String message) {
    return new ApiError(message, null);
  }

  public static ApiError of(String message, String detailMessage) {
    return new ApiError(message, detailMessage);
  }
}
