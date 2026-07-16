package com.projectsale.api.common.exception;

import com.projectsale.api.common.config.CorrelationIdFilter;
import com.projectsale.api.common.response.ApiError;
import com.projectsale.api.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

/**
 * Chuyển mọi exception thành envelope lỗi chuẩn hoá
 * {@code { error, data, pagination }}.
 * {@code correlationId} không nằm trong body mà đi qua header
 * {@code X-Correlation-Id}
 * (xem {@code CorrelationIdFilter}).
 */
@RestControllerAdvice
public class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  /** Lỗi nghiệp vụ có chủ đích: dùng đúng ErrorCode + thông điệp kèm theo. */
  @ExceptionHandler(AppException.class)
  ResponseEntity<ApiResponse<Void>> handleAppException(AppException exception) {
    return build(
        exception.errorCode(),
        ApiError.of(exception.getMessage(), exception.detailMessage()));
  }

  /** Body request không hợp lệ (@Valid @RequestBody). */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiResponse<Void>> handleBodyValidation(MethodArgumentNotValidException exception) {
    String detail = fieldErrorsDetail(exception.getBindingResult().getFieldErrors());
    return validationError(detail);
  }

  /**
   * Tham số request không hợp lệ khi controller được đánh dấu {@code @Validated}.
   */
  @ExceptionHandler(ConstraintViolationException.class)
  ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
      ConstraintViolationException exception) {
    return validationError(violationsDetail(exception.getConstraintViolations()));
  }

  /** Tham số request không hợp lệ khi dùng validation gốc của Spring MVC. */
  @ExceptionHandler(HandlerMethodValidationException.class)
  ResponseEntity<ApiResponse<Void>> handleMethodValidation(
      HandlerMethodValidationException exception) {
    String detail = exception.getAllErrors().stream()
        .map(MessageSourceResolvable::getDefaultMessage)
        .filter(Objects::nonNull)
        .collect(Collectors.joining("; "));
    return validationError(detail);
  }

  /** Lưới an toàn cuối cùng — không rò rỉ chi tiết nội bộ ra client. */
  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiResponse<Void>> handleUnexpected(
      Exception exception, HttpServletRequest request) {
    log.error(
        "Unhandled exception [correlationId={}, path={}]",
        request.getAttribute(CorrelationIdFilter.CORRELATION_ID_ATTRIBUTE),
        request.getRequestURI(),
        exception);
    return build(ErrorCode.INTERNAL_ERROR, ApiError.of(ErrorCode.INTERNAL_ERROR.defaultMessage()));
  }

  private ResponseEntity<ApiResponse<Void>> validationError(String detail) {
    String detailMessage = (detail == null || detail.isBlank()) ? null : detail;
    return build(
        ErrorCode.VALIDATION_ERROR,
        ApiError.of(ErrorCode.VALIDATION_ERROR.defaultMessage(), detailMessage));
  }

  private ResponseEntity<ApiResponse<Void>> build(ErrorCode errorCode, ApiError error) {
    return ResponseEntity.status(errorCode.httpStatus()).body(ApiResponse.error(error));
  }

  private static String fieldErrorsDetail(List<FieldError> fieldErrors) {
    return fieldErrors.stream()
        .map(error -> error.getField() + ": " + error.getDefaultMessage())
        .collect(Collectors.joining("; "));
  }

  private static String violationsDetail(Set<ConstraintViolation<?>> violations) {
    return violations.stream()
        .map(violation -> lastNode(violation.getPropertyPath()) + ": " + violation.getMessage())
        .collect(Collectors.joining("; "));
  }

  private static String lastNode(Path propertyPath) {
    String name = null;
    for (Path.Node node : propertyPath) {
      name = node.getName();
    }
    return name;
  }
}
