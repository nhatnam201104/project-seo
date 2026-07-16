import { createCookieSessionStorage } from "react-router";
import { serverEnv } from "~/core/config/env.server";
import type { AuthUser } from "~/features/auth/api/auth.types";

/**
 * SESSION-COOKIE BRIDGE (httpOnly).
 *
 * Backend trả access + refresh token trong body (KHÔNG phải httpOnly cookie).
 * Để JS client không bao giờ cầm token, server React Router lưu token vào session
 * cookie httpOnly của CHÍNH NÓ. Browser chỉ giữ cookie đã ký, không đọc được token.
 *
 * Luồng: browser → RR7 server (đọc token từ session) → Spring API (Bearer).
 */
export type SessionData = {
  accessToken: string;
  refreshToken: string;
  /** Ảnh chụp user để render nhanh; vẫn xác minh lại qua /me khi cần. */
  user: AuthUser;
};

type SessionFlashData = {
  error: string;
};

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

export const sessionStorage = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__ps_session",
    httpOnly: true,
    secure: serverEnv.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secrets: [serverEnv.sessionSecret],
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

export function getSessionFromRequest(request: Request) {
  return getSession(request.headers.get("Cookie"));
}
