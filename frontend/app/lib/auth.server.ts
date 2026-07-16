import { redirect } from "react-router";
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
}): Promise<Response> {
  const session = await getSession();
  session.set("accessToken", input.accessToken);
  session.set("refreshToken", input.refreshToken);
  session.set("user", input.user);

  return redirect(safeRedirect(input.redirectTo), {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

/** Huỷ session và điều hướng về đích (mặc định /login). */
export async function logout(
  request: Request,
  redirectTo = "/login",
): Promise<Response> {
  const session = await getSessionFromRequest(request);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

/** Trả về ngữ cảnh API + user (có thể null). Không chặn. */
export async function getAuth(request: Request): Promise<ServerApiContext> {
  return createServerApi(request);
}

/** Bắt buộc đăng nhập — nếu chưa, ném redirect về /login?redirectTo=... */
export async function requireUser(
  request: Request,
): Promise<ServerApiContext & { user: AuthUser }> {
  const auth = await createServerApi(request);
  if (!auth.isAuthenticated || !auth.user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return auth as ServerApiContext & { user: AuthUser };
}

/** Bắt buộc role ADMIN. USER thường bị đưa về trang chủ. */
export async function requireRole(
  request: Request,
  role: RoleCode,
): Promise<ServerApiContext & { user: AuthUser }> {
  const auth = await requireUser(request);
  if (auth.user.role !== role) {
    throw redirect("/");
  }
  return auth;
}

export function requireAdmin(request: Request) {
  return requireRole(request, ROLE.ADMIN);
}

/** Chỉ nhận đường dẫn nội bộ để tránh open-redirect. */
function safeRedirect(to: string, fallback = "/"): string {
  if (!to.startsWith("/") || to.startsWith("//")) return fallback;
  return to;
}
