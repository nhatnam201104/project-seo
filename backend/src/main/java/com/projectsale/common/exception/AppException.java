package com.projectsale.common.exception;

/**
 * Exception nghiệp vụ dùng chung. Mọi lỗi có chủ đích (không tìm thấy, xung
 * đột,
 * chưa xác thực, dữ liệu sai...) đều ném qua lớp này kèm một {@link ErrorCode}.
 *
 * <ul>
 * <li>{@code message} — thông điệp hiển thị cho người dùng.</li>
 * <li>{@code detailMessage} — chi tiết kỹ thuật tuỳ chọn (vd: lỗi từng
 * field).</li>
 * </ul>
 */
public class AppException extends RuntimeException {

  private final ErrorCode errorCode;
  private final String detailMessage;

  public AppException(ErrorCode errorCode) {
    this(errorCode, errorCode.defaultMessage(), null);
  }

  public AppException(ErrorCode errorCode, String message) {
    this(errorCode, message, null);
  }

  public AppException(ErrorCode errorCode, String message, String detailMessage) {
    super(message);
    this.errorCode = errorCode;
    this.detailMessage = detailMessage;
  }

  public ErrorCode errorCode() {
    return errorCode;
  }

  public String detailMessage() {
    return detailMessage;
  }

  // ---- Factory tiện dụng cho các trường hợp phổ biến ----

  public static AppException notFound(String message) {
    return new AppException(ErrorCode.NOT_FOUND, message);
  }

  public static AppException conflict(String message) {
    return new AppException(ErrorCode.CONFLICT, message);
  }

  public static AppException unauthorized(String message) {
    return new AppException(ErrorCode.UNAUTHORIZED, message);
  }

  public static AppException validation(String message) {
    return new AppException(ErrorCode.VALIDATION_ERROR, message);
  }
}
