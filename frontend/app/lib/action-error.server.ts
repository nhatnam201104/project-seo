import { isApiError } from "~/core/api";

const UNSUPPORTED_MESSAGE = "Chức năng này chưa được máy chủ hỗ trợ. Vui lòng thử lại sau.";

/**
 * Endpoint thực sự chưa tồn tại: 405/501, hoặc 404 "trần" (không có thông điệp từ envelope lỗi).
 * Một 404 có envelope (vd: ADDRESS_NOT_FOUND, USER_NOT_FOUND) là lỗi nghiệp vụ thật, không phải thiếu endpoint.
 */
export function isEndpointMissing(error: unknown): boolean {
  if (!isApiError(error)) return false;
  if (error.status === 405 || error.status === 501) return true;
  return error.status === 404 && error.bare === true;
}

/** Thông điệp lỗi thân thiện cho action của route. */
export function actionErrorMessage(error: unknown): { status: number; message: string } {
  if (isApiError(error)) {
    if (isEndpointMissing(error)) return { status: 503, message: UNSUPPORTED_MESSAGE };
    const status = error.status >= 400 ? error.status : 503;
    return { status, message: error.message || "Yêu cầu thất bại." };
  }
  return { status: 500, message: "Đã xảy ra lỗi. Vui lòng thử lại." };
}
