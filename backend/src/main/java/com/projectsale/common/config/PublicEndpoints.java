package com.projectsale.common.config;

import java.util.stream.Stream;

/**
 * Danh sách endpoint PUBLIC (whitelist) — tách riêng khỏi cấu hình bảo mật để
 * dễ
 * quản lý. Mọi request không khớp whitelist đều yêu cầu xác thực.
 *
 * <p>
 * Nhóm theo miền để đọc/bảo trì thuận tiện: auth công khai, đọc catalog, tài
 * liệu API. Khi cần mở/đóng một nhóm, chỉ sửa đúng mảng tương ứng.
 */
public final class PublicEndpoints {

  private PublicEndpoints() {
  }

  /** Auth công khai (chưa cần token): đăng ký, đăng nhập, làm mới token. */
  public static final String[] AUTH = {
      "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh"
  };

  /** Đọc catalog công khai: sản phẩm, danh mục, thương hiệu. */
  public static final String[] CATALOG = {
      "/api/v1/products/**", "/api/v1/categories/**", "/api/v1/brands/**"
  };

  /** Tài liệu OpenAPI / Swagger UI. */
  public static final String[] DOCS = {
      "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
  };

  /** Gộp toàn bộ whitelist cho {@code permitAll()}. */
  public static String[] all() {
    return Stream.of(AUTH, CATALOG, DOCS).flatMap(Stream::of).toArray(String[]::new);
  }
}
