import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import * as authApi from "~/features/auth/api/auth.api";
import { logout } from "~/lib/auth.server";
import { createAuthedServerApi } from "~/lib/http.server";
import { getSessionFromRequest } from "~/lib/session.server";

/** Không cho logout bằng GET (tránh CSRF/prefetch) → về trang chủ. */
export async function loader() {
  return redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSessionFromRequest(request);
  const refreshToken = session.get("refreshToken");
  const accessToken = session.get("accessToken");

  // Best-effort: thu hồi refresh token phía backend; vẫn xoá session dù lỗi.
  if (refreshToken && accessToken) {
    try {
      await authApi.logout(createAuthedServerApi(accessToken), {
        refresh_token: refreshToken,
      });
    } catch {
      // Bỏ qua — ưu tiên đảm bảo session client bị huỷ.
    }
  }

  return logout(request, "/");
}
