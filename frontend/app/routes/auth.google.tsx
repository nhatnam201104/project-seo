import { redirect } from "react-router";
import type { Route } from "./+types/auth.google";
import { getAuth, safeRedirect } from "~/lib/auth.server";
import {
  createOAuthState,
  googleAuthStartUrl,
  saveOAuthState,
} from "~/features/auth/services/oauth-state.server";

/**
 * Resource route: bắt đầu đăng nhập Google. Ghi `bind` + `redirectTo` vào cookie
 * httpOnly rồi chuyển trình duyệt sang backend (Spring oauth2Login) → Google.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const redirectTo = safeRedirect(
    new URL(request.url).searchParams.get("redirectTo") ?? "/account",
  );
  const auth = await getAuth(request, context);
  if (auth.isAuthenticated) throw redirect(redirectTo);

  const state = createOAuthState(redirectTo);
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", await saveOAuthState(state));
  return redirect(googleAuthStartUrl(state.bind), { headers });
}
