import { randomBytes } from "node:crypto";
import { createCookie } from "react-router";
import { z } from "zod";
import { serverEnv } from "~/core/config/env.server";

/**
 * Trạng thái một vòng đăng nhập Google, giữ trong cookie httpOnly đã ký của SSR.
 *
 * `bind` là nonce gửi kèm lúc bắt đầu (backend gắn nó vào mã trao tay) và phải
 * khớp khi đổi mã → chỉ trình duyệt đã bấm "Continue with Google" mới dùng được
 * mã đó (chống login CSRF). Cookie chỉ gửi tới /auth/google/*.
 */
const OAUTH_STATE_MAX_AGE = 10 * 60;

const cookie = createCookie("__ps_oauth", {
  httpOnly: true,
  sameSite: "lax",
  secure: serverEnv.cookieSecure,
  path: "/auth/google",
  maxAge: OAUTH_STATE_MAX_AGE,
  secrets: [serverEnv.sessionSecret],
});

export const oauthStateSchema = z.object({
  bind: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  redirectTo: z.string().startsWith("/"),
});
export type OAuthState = z.infer<typeof oauthStateSchema>;

/** `redirectTo` phải được lọc bằng safeRedirect trước khi truyền vào. */
export function createOAuthState(redirectTo: string): OAuthState {
  return { bind: randomBytes(32).toString("base64url"), redirectTo };
}

export async function saveOAuthState(state: OAuthState): Promise<string> {
  return cookie.serialize(oauthStateSchema.parse(state));
}

export async function clearOAuthState(): Promise<string> {
  return cookie.serialize("", { maxAge: 0, expires: new Date(0) });
}

export async function readOAuthState(
  request: Request,
): Promise<OAuthState | null> {
  try {
    const parsed = oauthStateSchema.safeParse(
      await cookie.parse(request.headers.get("Cookie")),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** URL bắt đầu vòng OAuth ở backend, kèm `bind`. */
export function googleAuthStartUrl(bind: string): string {
  const start = serverEnv.googleAuthStartUrl;
  const separator = start.includes("?") ? "&" : "?";
  return `${start}${separator}bind=${encodeURIComponent(bind)}`;
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  email_not_verified:
    "Email Google của bạn chưa được xác minh. Vui lòng xác minh email rồi thử lại.",
  account_disabled:
    "Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ bộ phận hỗ trợ.",
  account_conflict:
    "Email này đã được liên kết với một tài khoản Google khác.",
  access_denied: "Bạn đã huỷ đăng nhập bằng Google.",
};
const OAUTH_FAILED_MESSAGE =
  "Đăng nhập bằng Google không thành công. Vui lòng thử lại.";

/** Mã lỗi từ query `oauth_error` → thông báo; null nếu không có lỗi. */
export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? OAUTH_FAILED_MESSAGE;
}
