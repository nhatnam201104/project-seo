package com.projectsale.api.common.response;

import org.springframework.data.domain.Page;

/**
 * Thông tin phân trang tách riêng khỏi {@code data} trong envelope chuẩn hoá.
 * {@code page} theo chuẩn Spring Data — bắt đầu từ 0.
 */
public record Pagination(int page, int size, long totalElements, int totalPages) {

  public static Pagination from(Page<?> page) {
    return new Pagination(
        page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }
}
