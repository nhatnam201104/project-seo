import { Form, Link, redirect } from "react-router";
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
import { AuthField } from "~/components/storefront/AuthField";
import { AuthShell } from "~/components/storefront/AuthShell";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Đăng nhập — ProjectSale" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (auth.isAuthenticated) throw redirect("/account");
  const url = new URL(request.url);
  return { redirectTo: url.searchParams.get("redirectTo") ?? "/account" };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirectTo") ?? "/account");

  if (!email || !password) {
    return data(
      {
        error: "Vui lòng kiểm tra lại thông tin đăng nhập.",
        fieldErrors: {
          email: email ? undefined : "Vui lòng nhập email.",
          password: password ? undefined : "Vui lòng nhập mật khẩu.",
        },
      },
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
    return data({
      error: message,
      fieldErrors: { email: undefined, password: undefined },
    }, { status });
  }
}

export default function Login({ actionData, loaderData }: Route.ComponentProps) {
  return (
    <AuthShell title="LOGIN" eyebrow="MEMBER ACCESS">
      <Form method="post" className="auth-form">
        <input type="hidden" name="redirectTo" value={loaderData.redirectTo} />
        {actionData?.error ? <p className="auth-form__error" role="alert">{actionData.error}</p> : null}
        <AuthField label="Email" type="email" name="email" placeholder="Email của bạn" required autoComplete="email" error={actionData?.fieldErrors?.email} />
        <AuthField label="Mật khẩu" type="password" name="password" placeholder="Mật khẩu" required autoComplete="current-password" error={actionData?.fieldErrors?.password} />
        <div className="auth-form__options">
          <label className="auth-check"><input type="checkbox" name="remember" /> Ghi nhớ tôi</label>
          <Link to="/login">Quên mật khẩu?</Link>
        </div>
        <button className="auth-button" type="submit">LOGIN</button>
        <button className="auth-button auth-button--secondary" type="button" disabled aria-disabled="true">CONTINUE WITH GOOGLE</button>
        <p className="auth-form__switch">NEW HERE? <Link to="/register">REGISTER</Link></p>
      </Form>
    </AuthShell>
  );
}
