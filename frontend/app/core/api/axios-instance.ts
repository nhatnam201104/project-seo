import axios, { type AxiosInstance } from "axios";

/**
 * Factory tạo Axios instance nền (chưa gắn auth).
 *
 * Vì sao là factory chứ không phải singleton module-level:
 * dưới SSR, mỗi request của một user khác nhau cần token khác nhau. Một instance
 * dùng chung giữ token toàn cục sẽ RÒ token giữa các request. Nên client có auth
 * được tạo per-request ở `lib/http.server.ts` qua `createApiClient()`.
 *
 * `baseURL` bắt buộc truyền vào — file này KHÔNG đọc env trực tiếp (env chỉ đọc ở
 * module env đã validate rồi truyền xuống), giữ core/api thuần và test được.
 */
export type BaseInstanceOptions = {
  baseURL: string;
  timeoutMs?: number;
};

export function createAxiosInstance(options: BaseInstanceOptions): AxiosInstance {
  return axios.create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs ?? 15_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    // JWT đi trong header Authorization, KHÔNG dùng cookie của Spring => tắt.
    withCredentials: false,
  });
}

export type { AxiosInstance };
