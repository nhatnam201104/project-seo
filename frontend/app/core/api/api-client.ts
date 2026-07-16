import { createAxiosInstance } from "./axios-instance";
import type { AxiosInstance } from "./axios-instance";
import {
  applyRequestInterceptor,
  type RequestContext,
} from "./interceptors/request.interceptor";
import { applyResponseInterceptor } from "./interceptors/response.interceptor";
import {
  applyRefreshInterceptor,
  type RefreshContext,
} from "./interceptors/refresh-token.interceptor";

export type CreateApiClientOptions = {
  baseURL: string;
  timeoutMs?: number;
  request?: RequestContext;
  /** Bỏ qua nếu client không cần tự refresh (vd: client công khai, không auth). */
  refresh?: RefreshContext;
};

/**
 * Điểm TẠO Axios client duy nhất của toàn app. Mọi feature/api module nhận một
 * `AxiosInstance` từ đây (dependency injection) thay vì import axios trực tiếp.
 *
 * Thứ tự interceptor quan trọng:
 *  1) request  — gắn Bearer/correlation-id.
 *  2) refresh  — xử lý 401 TRƯỚC khi lỗi bị map (nó cần AxiosError gốc).
 *  3) response — map AxiosError -> ApiError (chạy sau cùng trên nhánh lỗi).
 */
export function createApiClient(
  options: CreateApiClientOptions,
): AxiosInstance {
  const instance = createAxiosInstance({
    baseURL: options.baseURL,
    timeoutMs: options.timeoutMs,
  });

  applyRequestInterceptor(instance, options.request ?? {});
  if (options.refresh) {
    applyRefreshInterceptor(instance, options.refresh);
  }
  applyResponseInterceptor(instance);

  return instance;
}

export type { AxiosInstance };
