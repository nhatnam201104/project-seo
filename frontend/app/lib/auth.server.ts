import { redirect, type AppLoadContext } from "react-router";
import { isApiError } from "~/core/api";
import * as authApi from "~/features/auth/api/auth.api";
import { clearPendingVerification } from "~/features/auth/services/pending-verification.server";
import { ROLE, type RoleCode } from "~/core/domain/enums";
import type { AuthUser } from "~/features/auth/api/auth.types";
import {
  commitSession,
  destroySession,
  getSession,
  getSessionFromRequest,
} from "./session.server";
import { createServerApi, type ServerApiContext } from "./http.server";

/** Tạo session sau khi đăng nhập/đăng ký thành công, rồi điều hướng. */
export async function createUserSession(input: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  redirectTo: string;
  deviceId: string;
  remember?: boolean;
  headers?: Headers;
}): Promise<Response> {
  const session = await getSession();
  session.set("accessToken", input.accessToken);
  session.set("refreshToken", input.refreshToken);
  session.set("user", input.user);
  session.set("deviceId", input.deviceId);
  session.set("remember", input.remember ?? false);
  const headers = new Headers(input.headers);
  headers.append(
    "Set-Cookie",
    await commitSession(session, {
      maxAge: input.remember ? 60 * 60 * 24 * 7 : undefined,
    }),
  );
  headers.append("Set-Cookie", await clearPendingVerification());
  return redirect(safeRedirect(input.redirectTo), {
    headers,
  });
}

/** Huỷ session và điều hướng về đích (mặc định /login). */
export async function logout(
  request: Request,
  redirectTo = "/login",
): Promise<Response> {
  const session = await getSessionFromRequest(request);
  const headers = new Headers();
  headers.append("Set-Cookie", await destroySession(session));
  headers.append("Set-Cookie", await clearPendingVerification());
  return redirect(redirectTo, {
    headers,
  });
}

/** Trả về ngữ cảnh API + user (có thể null). Không chặn. */
export async function getAuth(
  request: Request,
  context: AppLoadContext,
): Promise<ServerApiContext> {
  return createServerApi(request, context);
}

/** Bắt buộc đăng nhập — nếu chưa, ném redirect về /login?redirectTo=... */
export async function requireUser(
  request: Request,
  context: AppLoadContext,
): Promise<ServerApiContext & { user: AuthUser }> {
  const auth = await createServerApi(request, context);
  if (!auth.isAuthenticated || !auth.user) {
    const url = new URL(request.url);
    throw redirect(
      `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`,
    );
  }
  try {
    auth.user = await authApi.getMe(auth.client, request.signal);
  } catch (error) {
    const setCookie = await auth.commit();
    const headers = new Headers();
    if (setCookie) headers.append("Set-Cookie", setCookie);
    if (isApiError(error) && error.status === 401) {
      if (!setCookie)
        headers.append(
          "Set-Cookie",
          await destroySession(await getSessionFromRequest(request)),
        );
      const url = new URL(request.url);
      throw redirect(
        `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`,
        { headers },
      );
    }
    throw new Response("Không thể tải tài khoản. Vui lòng thử lại sau.", {
      status: isApiError(error) && error.status >= 400 ? error.status : 503,
      headers,
    });
  }
  return auth as ServerApiContext & { user: AuthUser };
}

/** Bắt buộc role ADMIN. USER thường bị đưa về trang chủ. */
export async function requireRole(
  request: Request,
  context: AppLoadContext,
  role: RoleCode,
): Promise<ServerApiContext & { user: AuthUser }> {
  const auth = await requireUser(request, context);
  if (auth.user.role !== role) {
    const cookie = await auth.commit();
    throw redirect(
      "/",
      cookie ? { headers: { "Set-Cookie": cookie } } : undefined,
    );
  }
  return auth;
}

export function requireAdmin(request: Request, context: AppLoadContext) {
  return requireRole(request, context, ROLE.ADMIN);
}

/** Chỉ nhận đường dẫn nội bộ để tránh open-redirect. */
export function safeRedirect(to: string, fallback = "/account"): string {
  if (
    !to.startsWith("/") ||
    to.startsWith("//") ||
    to.includes("\\") ||
    [...to].some(
      (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    )
  )
    return fallback;
  return to;
}
