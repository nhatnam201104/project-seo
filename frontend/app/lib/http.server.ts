import { createApiClient, type AxiosInstance } from "~/core/api";
import { serverEnv } from "~/core/config/env.server";
import * as authApi from "~/features/auth/api/auth.api";
import type { AuthUser } from "~/features/auth/api/auth.types";
import {
  commitSession,
  destroySession,
  getSessionFromRequest,
} from "./session.server";

/**
 * Client Axios công khai (không auth) — dùng cho endpoint PUBLIC ở server và cho
 * chính lời gọi /auth/refresh (tránh đệ quy interceptor refresh).
 */
export const publicServerApi: AxiosInstance = createApiClient({
  baseURL: serverEnv.apiBaseUrl,
  timeoutMs: serverEnv.apiTimeoutMs,
});

/**
 * Client gắn sẵn một access token cụ thể, không kèm refresh — dùng cho thao tác
 * one-off ngay sau đăng nhập (vd: gọi /me với token vừa cấp).
 */
export function createAuthedServerApi(accessToken: string): AxiosInstance {
  return createApiClient({
    baseURL: serverEnv.apiBaseUrl,
    timeoutMs: serverEnv.apiTimeoutMs,
    request: { getAccessToken: () => accessToken },
  });
}

export type ServerApiContext = {
  /** Client đã gắn Bearer token của user cho request hiện tại. */
  client: AxiosInstance;
  /** Ảnh chụp user trong session (null nếu chưa đăng nhập). */
  user: AuthUser | null;
  isAuthenticated: boolean;
  /**
   * Ghi lại thay đổi session (sau khi refresh token) → trả Set-Cookie để route
   * đính vào response. Trả null nếu session không đổi.
   * Nếu refresh thất bại → session bị huỷ (Set-Cookie xoá cookie).
   */
  commit: () => Promise<string | null>;
};

/**
 * Tạo ngữ cảnh API cho MỘT request SSR. Token được đọc từ session cookie httpOnly,
 * gắn Bearer per-request, và tự refresh khi 401 (single-flight, retry 1 lần).
 */
export async function createServerApi(
  request: Request,
): Promise<ServerApiContext> {
  const session = await getSessionFromRequest(request);

  const tokens = {
    accessToken: session.get("accessToken") ?? null,
    refreshToken: session.get("refreshToken") ?? null,
  };
  const user = session.get("user") ?? null;

  let dirty = false;
  let invalid = false;

  const client = createApiClient({
    baseURL: serverEnv.apiBaseUrl,
    timeoutMs: serverEnv.apiTimeoutMs,
    request: {
      getAccessToken: () => tokens.accessToken,
    },
    refresh: {
      getRefreshToken: () => tokens.refreshToken,
      performRefresh: async (refreshToken) => {
        const res = await authApi.refresh(publicServerApi, refreshToken);
        return {
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
        };
      },
      onTokensRefreshed: ({ accessToken, refreshToken }) => {
        tokens.accessToken = accessToken;
        tokens.refreshToken = refreshToken;
        dirty = true;
      },
      onRefreshFailed: () => {
        invalid = true;
      },
    },
  });

  return {
    client,
    user,
    isAuthenticated: Boolean(tokens.accessToken),
    commit: async () => {
      if (invalid) {
        return destroySession(session);
      }
      if (dirty && tokens.accessToken && tokens.refreshToken) {
        session.set("accessToken", tokens.accessToken);
        session.set("refreshToken", tokens.refreshToken);
        return commitSession(session);
      }
      return null;
    },
  };
}
