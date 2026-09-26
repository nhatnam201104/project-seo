package com.projectsale.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Bảng mã lỗi dùng chung cho toàn API. Mỗi mã gắn với một HTTP status và một
 * thông điệp mặc định (tiếng người dùng đọc được). Ném lỗi luôn đi qua
 * {@link AppException} + một {@code ErrorCode}, không dùng exception rời rạc
 * nữa.
 */
public enum ErrorCode {
  VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
  UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Yêu cầu xác thực"),
  FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
  NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên"),
  CONFLICT(HttpStatus.CONFLICT, "Dữ liệu bị xung đột"),
  INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi không mong muốn"),
  TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "Too many requests"),

  // AUTH
  EMAIL_ALREADY_EXIST(HttpStatus.CONFLICT, "Email already exists"),
  PHONE_ALREADY_EXIST(HttpStatus.CONFLICT, "Phone number already exists"),
  ACCOUNT_NOT_VERIFY(HttpStatus.FORBIDDEN, "Account not verified"),
  INVALID_OTP(HttpStatus.BAD_REQUEST, "Invalid OTP OR expired"),
  INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"),
  OTP_EXPIRED(HttpStatus.BAD_REQUEST, "OTP has expired or is invalid"),
  DEVICE_NOT_LOGIN (HttpStatus.FORBIDDEN, "Device not logged in"),
  INVALID_DEVICE_ID (HttpStatus.FORBIDDEN, "Invalid device ID"),
  ACCOUNT_ALREADY_VERIFIED (HttpStatus.FORBIDDEN, "Account already verified"),
  ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "Account disabled"),
  // Redis
  REDIS_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Error occurred while interacting with Redis"),

  // User
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found"),
  INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Invalid email or password"),

  ;

  private final HttpStatus httpStatus;
  private final String defaultMessage;

  ErrorCode(HttpStatus httpStatus, String defaultMessage) {
    this.httpStatus = httpStatus;
    this.defaultMessage = defaultMessage;
  }

  public HttpStatus httpStatus() {
    return httpStatus;
  }

  public String defaultMessage() {
    return defaultMessage;
  }
}
