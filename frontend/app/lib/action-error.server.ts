import { isApiError } from "~/core/api";

/** Thông điệp lỗi thân thiện cho action của route (404/501 = backend chưa có endpoint). */
export function actionErrorMessage(error: unknown): { status: number; message: string } {
  if (isApiError(error)) {
    const status = error.status >= 400 ? error.status : 503;
    if (status === 404 || status === 405 || status === 501) {
      return { status: 503, message: "Chức năng này chưa được máy chủ hỗ trợ. Vui lòng thử lại sau." };
    }
    return { status, message: error.message || "Yêu cầu thất bại." };
  }
  return { status: 500, message: "Đã xảy ra lỗi. Vui lòng thử lại." };
}

export function isEndpointMissing(error: unknown): boolean {
  return isApiError(error) && [404, 405, 501].includes(error.status);
}
