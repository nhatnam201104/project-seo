import axios from "axios";
import type { ApiEnvelope } from "./api-response";

/**
 * Lỗi chuẩn hoá của ứng dụng. Component / service / route chỉ làm việc với
 * `ApiError`, KHÔNG phụ thuộc trực tiếp vào `AxiosError`.
 *
 * Shape bám theo envelope lỗi backend:
 *   { error: { message, detailMessage? }, data: null, pagination: null }
 *
 * `correlationId` đọc từ response header `X-Correlation-Id` (không nằm trong body).
 */
export type ApiError = {
  status: number;
  message: string;
  /** Chi tiết kỹ thuật tuỳ chọn từ backend (vd: lỗi từng field gộp lại). */
  detailMessage?: string;
  correlationId?: string;
  cause?: unknown;
};

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value
  );
}

/** Chuyển bất kỳ lỗi nào (Axios / network / timeout / abort) về ApiError. */
export function mapAxiosError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return { status: 0, message: "Yêu cầu đã bị huỷ.", cause: error };
  }

  if (!axios.isAxiosError(error)) {
    return {
      status: 0,
      message: "Đã xảy ra lỗi không xác định.",
      cause: error,
    };
  }

  if (error.code === "ECONNABORTED") {
    return { status: 0, message: "Yêu cầu quá thời gian chờ.", cause: error };
  }

  if (!error.response) {
    return {
      status: 0,
      message: "Không thể kết nối đến máy chủ.",
      cause: error,
    };
  }

  const envelope = (error.response.data ?? {}) as Partial<ApiEnvelope<unknown>>;
  const correlationId = error.response.headers?.["x-correlation-id"] as
    | string
    | undefined;

  return {
    status: error.response.status,
    message: envelope.error?.message ?? defaultMessageFor(error.response.status),
    detailMessage: envelope.error?.detailMessage,
    correlationId,
    cause: error,
  };
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return "Dữ liệu không hợp lệ.";
    case 401:
      return "Bạn cần đăng nhập để tiếp tục.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Không tìm thấy tài nguyên.";
    case 409:
      return "Dữ liệu bị xung đột.";
    case 422:
      return "Yêu cầu không thể xử lý.";
    case 429:
      return "Bạn thao tác quá nhanh, vui lòng thử lại sau.";
    default:
      return status >= 500 ? "Lỗi hệ thống, vui lòng thử lại sau." : "Yêu cầu thất bại.";
  }
}
