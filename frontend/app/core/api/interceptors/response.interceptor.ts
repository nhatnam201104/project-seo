import type { AxiosInstance } from "axios";
import { mapAxiosError } from "../api-error";

/**
 * Chuyển mọi AxiosError thành ApiError chuẩn hoá trước khi ném ra ngoài.
 * Nhờ vậy tầng service/route/component không bao giờ chạm tới AxiosError.
 *
 * Đặt SAU refresh interceptor để không nuốt mất lỗi 401 mà refresh cần xử lý.
 */
export function applyResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(mapAxiosError(error)),
  );
}
