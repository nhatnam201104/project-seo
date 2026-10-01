import { redirect } from "react-router";
import type { Route } from "./+types/auth.google.callback";
import { isApiError } from "~/core/api";
import * as authApi from "~/features/auth/api/auth.api";
import { createUserSession } from "~/lib/auth.server";
import { createPublicServerApi } from "~/lib/http.server";
import { getDevice } from "~/features/auth/services/device.server";
import {
  clearOAuthState,
  readOAuthState,
} from "~/features/auth/services/oauth-state.server";

function loginWithError(code: string, headers: Headers, redirectTo?: string) {
  const query = new URLSearchParams({ oauth_error: code });
  if (redirectTo) query.set("redirectTo", redirectTo);
  return redirect(`/login?${query}`, { headers });
}

/**
 * Resource route: backend redirect về đây với mã một lần sau khi Google xác thực.
 * Đổi mã (kèm `bind` trong cookie và thiết bị) lấy token rồi tạo session httpOnly.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const code = new URL(request.url).searchParams.get("code");
  const state = await readOAuthState(request);
  const { device, headers } = await getDevice(request);
  headers.set("Cache-Control", "no-store");
  headers.append("Set-Cookie", await clearOAuthState());
  // Không có cookie = trình duyệt này không bắt đầu vòng đăng nhập (hoặc đã hết hạn).
  if (!code || !state) return loginWithError("oauth_failed", headers);

  try {
    const res = await authApi.exchangeOAuth2Code(
      createPublicServerApi(request, context),
      { code, bind: state.bind, ...device },
      request.signal,
    );
    return await createUserSession({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      user: res.user,
      deviceId: device.deviceId,
      remember: false,
      headers,
      redirectTo: state.redirectTo,
    });
  } catch (error) {
    const disabled = isApiError(error) && error.status === 403;
    return loginWithError(
      disabled ? "account_disabled" : "oauth_failed",
      headers,
      state.redirectTo,
    );
  }
}
