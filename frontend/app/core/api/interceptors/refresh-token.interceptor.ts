import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export type RefreshedTokens = {
  accessToken: string;
  /** Refresh token mới bắt buộc được lưu sau mỗi lần rotation. */
  refreshToken: string;
};

/**
 * Ngữ cảnh refresh — mọi hiểu biết về endpoint/nơi lưu token nằm ở caller
 * (`lib/http.server.ts`), interceptor này chỉ điều phối:
 *  - single-flight: nhiều 401 đồng thời chỉ gọi refresh MỘT lần.
 *  - retry tối đa 1 lần cho mỗi request (cờ `_retry`).
 *  - không refresh khi request bị abort; không lặp vô hạn.
 *  - refresh thất bại → onRefreshFailed (xoá session, điều hướng login).
 */
export type RefreshContext = {
  getRefreshToken: () => string | null | undefined;
  performRefresh: (refreshToken: string) => Promise<RefreshedTokens>;
  onTokensRefreshed: (tokens: RefreshedTokens) => void;
  onRefreshFailed: () => void;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export function applyRefreshInterceptor(
  instance: AxiosInstance,
  ctx: RefreshContext,
): void {
  // Đóng gói theo instance (per-request) => single-flight đúng phạm vi request.
  let refreshPromise: Promise<RefreshedTokens> | null = null;

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || axios.isCancel(error)) {
        return Promise.reject(error);
      }

      const config = error.config as RetriableConfig | undefined;
      const status = error.response?.status;

      if (status !== 401 || !config || config._retry) {
        return Promise.reject(error);
      }

      const refreshToken = ctx.getRefreshToken();
      if (!refreshToken) {
        ctx.onRefreshFailed();
        return Promise.reject(error);
      }

      config._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = ctx
            .performRefresh(refreshToken)
            .then((tokens) => {
              ctx.onTokensRefreshed(tokens);
              return tokens;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const tokens = await refreshPromise;

        // Gắn token mới cho lần retry (headers là AxiosHeaders → dùng .set).
        config.headers.set("Authorization", `Bearer ${tokens.accessToken}`);

        return instance(config);
      } catch {
        ctx.onRefreshFailed();
        return Promise.reject(error);
      }
    },
  );
}
