import type { AppLoadContext } from "react-router";
import {
  createApiClient,
  type AxiosInstance,
  type ForwardedClient,
} from "~/core/api";
import { serverEnv } from "~/core/config/env.server";
import * as authApi from "~/features/auth/api/auth.api";
import type { AuthUser } from "~/features/auth/api/auth.types";
import {
  commitSession,
  destroySession,
  getSessionFromRequest,
} from "./session.server";

/**
 * Danh tính trình duyệt gửi kèm mọi lời gọi API của request SSR này. Không có bí
 * mật dùng chung → không gửi gì (backend sẽ không tin header chuyển tiếp).
 */
function forwardedClient(
  request: Request,
  context: AppLoadContext,
): ForwardedClient | undefined {
  const secret = serverEnv.internalProxySecret;
  if (!secret) return undefined;
  return {
    secret,
    clientIp: context.clientIp,
    userAgent: request.headers.get("User-Agent") ?? undefined,
  };
}

/**
 * Client công khai (không auth) cho MỘT request SSR — dùng cho endpoint PUBLIC và
 * cho chính lời gọi /auth/refresh (tránh đệ quy interceptor refresh).
 *
 * Không dùng singleton: rate limit của backend tính theo IP trình duyệt, nên mỗi
 * request phải mang danh tính của đúng người dùng đó.
 */
export function createPublicServerApi(
  request: Request,
  context: AppLoadContext,
): AxiosInstance {
  return createApiClient({
    baseURL: serverEnv.apiBaseUrl,
    timeoutMs: serverEnv.apiTimeoutMs,
    request: { forwarded: forwardedClient(request, context) },
  });
}

/**
 * Client gắn sẵn một access token cụ thể, không kèm refresh — dùng cho thao tác
 * one-off (vd: thu hồi refresh token khi đăng xuất).
 */
export function createAuthedServerApi(
  accessToken: string,
  request: Request,
  context: AppLoadContext,
): AxiosInstance {
  return createApiClient({
    baseURL: serverEnv.apiBaseUrl,
    timeoutMs: serverEnv.apiTimeoutMs,
    request: {
      getAccessToken: () => accessToken,
      forwarded: forwardedClient(request, context),
    },
  });
}

export type ServerApiContext = {
  /** Client đã gắn Bearer token của user cho request hiện tại. */
  client: AxiosInstance;
  /** Ảnh chụp user trong session (null nếu chưa đăng nhập). */
  user: AuthUser | null;
  isAuthenticated: boolean;
  getTokens: () => { accessToken: string | null; refreshToken: string | null };
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
  context: AppLoadContext,
): Promise<ServerApiContext> {
  const session = await getSessionFromRequest(request);

  const tokens = {
    accessToken: session.get("accessToken") ?? null,
    refreshToken: session.get("refreshToken") ?? null,
  };
  const user = session.get("user") ?? null;
  const forwarded = forwardedClient(request, context);
  const refreshApi = createPublicServerApi(request, context);

  let dirty = false;
  let invalid = false;

  const client = createApiClient({
    baseURL: serverEnv.apiBaseUrl,
    timeoutMs: serverEnv.apiTimeoutMs,
    request: {
      getAccessToken: () => tokens.accessToken,
      forwarded,
    },
    refresh: {
      getRefreshToken: () => tokens.refreshToken,
      performRefresh: async (refreshToken) => {
        const res = await authApi.refresh(refreshApi, {
          refresh_token: refreshToken,
        });
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
    getTokens: () => ({ ...tokens }),
    commit: async () => {
      if (invalid) {
        return destroySession(session);
      }
      if (dirty && tokens.accessToken && tokens.refreshToken) {
        session.set("accessToken", tokens.accessToken);
        session.set("refreshToken", tokens.refreshToken);
        return commitSession(session, {
          maxAge: session.get("remember") ? 60 * 60 * 24 * 7 : undefined,
        });
      }
      return null;
    },
  };
}
