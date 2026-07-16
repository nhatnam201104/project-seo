package com.projectsale.api.common.response;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Envelope chuẩn hoá cho MỌI response của API.
 *
 * <pre>{@code
 * {
 * "error": { "message": "...", "detailMessage": "..." } | null,
 * "data": <payload> | null,
 * "pagination": { "page", "size", "totalElements", "totalPages" } | null
 * }
 * }</pre>
 *
 * Ba khoá luôn hiện diện (null khi không áp dụng) để client có shape đồng nhất.
 */
public record ApiResponse<T>(ApiError error, T data, Pagination pagination) {

  /** Thành công không phân trang. */
  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(null, data, null);
  }

  /**
   * Thành công có phân trang: tách {@code content} ra {@code data}, meta ra
   * {@code pagination}.
   */
  public static <E> ApiResponse<List<E>> page(Page<E> page) {
    return new ApiResponse<>(null, page.getContent(), Pagination.from(page));
  }

  /** Lỗi: chỉ mang khối {@code error}. */
  public static ApiResponse<Void> error(ApiError error) {
    return new ApiResponse<>(error, null, null);
  }
}
