import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import * as authApi from "~/features/auth/api/auth.api";
import { logout } from "~/lib/auth.server";
import { createAuthedServerApi, createServerApi } from "~/lib/http.server";
import { getSessionFromRequest } from "~/lib/session.server";

/** Không cho logout bằng GET (tránh CSRF/prefetch) → về trang chủ. */
export async function loader() {
  return redirect("/");
}

export async function action({ request, context }: Route.ActionArgs) {
  const session = await getSessionFromRequest(request);
  const refreshToken = session.get("refreshToken");
  const accessToken = session.get("accessToken");
  const deviceId = session.get("deviceId");

  // Best-effort: thu hồi refresh token phía backend; vẫn xoá session dù lỗi.
  if (refreshToken && accessToken && deviceId) {
    try {
      // Refresh first, then revoke the current rotated refresh token.
      const auth = await createServerApi(request, context);
      await authApi.getMe(auth.client, request.signal);
      const current = auth.getTokens();
      await authApi.logout(
        createAuthedServerApi(current.accessToken!, request, context),
        {
          refresh_token: current.refreshToken!,
          deviceId,
        },
        request.signal,
      );
    } catch {
      // Bỏ qua — ưu tiên đảm bảo session client bị huỷ.
    }
  }

  return logout(request, "/");
}
