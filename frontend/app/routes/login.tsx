import { Form, redirect } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/login";
import { isApiError } from "~/core/api";
import * as authApi from "~/features/auth/api/auth.api";
import {
  createUserSession,
  getAuth,
} from "~/lib/auth.server";
import {
  createAuthedServerApi,
  publicServerApi,
} from "~/lib/http.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Đăng nhập — ProjectSale" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (auth.isAuthenticated) throw redirect("/account");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirectTo") ?? "/account");

  if (!email || !password) {
    return data(
      { error: "Vui lòng nhập email và mật khẩu." },
      { status: 400 },
    );
  }

  try {
    const res = await authApi.login(
      publicServerApi,
      { email, password },
      request.signal,
    );

    // Login payload có thể không kèm user → lấy chắc chắn qua /me với token mới.
    const user =
      res.user ??
      (await authApi.getMe(createAuthedServerApi(res.access_token)));

    // → set session httpOnly, điều hướng. Token KHÔNG bao giờ về client bundle.
    return createUserSession({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      user,
      redirectTo,
    });
  } catch (err) {
    const message = isApiError(err) ? err.message : "Đăng nhập thất bại.";
    const status = isApiError(err) && err.status ? err.status : 400;
    return data({ error: message }, { status });
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <section style={{ maxWidth: 380, margin: "5vh auto" }} aria-labelledby="login-heading">
      <h1 id="login-heading">Đăng nhập</h1>
      {actionData?.error ? (
        <p style={{ color: "var(--color-danger)" }}>{actionData.error}</p>
      ) : null}
      <Form method="post" style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit">Đăng nhập</button>
      </Form>
    </section>
  );
}
