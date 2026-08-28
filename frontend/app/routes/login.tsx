import { Form, Link, redirect, data } from "react-router";
import type { Route } from "./+types/login";
import * as authApi from "~/features/auth/api/auth.api";
import { createUserSession, getAuth, safeRedirect } from "~/lib/auth.server";
import { createPublicServerApi } from "~/lib/http.server";
import { AuthField } from "~/components/storefront/AuthField";
import { AuthShell } from "~/components/storefront/AuthShell";
import {
  loginFormSchema,
  validationErrors,
} from "~/features/auth/validation/auth.schema";
import { useAuthForm } from "~/features/auth/hooks/useAuthForm";
import { useRetryCountdown } from "~/features/auth/hooks/useRetryCountdown";
import {
  authFormError,
  isPendingAccountError,
  type AuthActionData,
} from "~/features/auth/services/auth-form.server";
import { beginPendingVerification } from "~/features/auth/services/pending-verification.server";
import { getDevice } from "~/features/auth/services/device.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Đăng nhập — ProjectSale" }];
}
export async function loader({ request, context }: Route.LoaderArgs) {
  const redirectTo = safeRedirect(
    new URL(request.url).searchParams.get("redirectTo") ?? "/account",
  );
  const auth = await getAuth(request, context);
  if (auth.isAuthenticated) throw redirect(redirectTo);
  const { headers } = await getDevice(request);
  headers.set("Cache-Control", "no-store");
  const verification = new URL(request.url).searchParams.get("verification");
  return data(
    {
      redirectTo,
      notice:
        verification === "expired"
          ? "Phiên xác thực đã hết hạn hoặc không còn tồn tại. Vui lòng đăng nhập để tiếp tục."
          : verification === "cancelled"
            ? "Đã hủy phiên xác thực. Bạn có thể đăng nhập lại."
            : null,
    },
    { headers },
  );
}
export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const parsed = loginFormSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return data<AuthActionData>(
      {
        error: "Vui lòng kiểm tra lại thông tin đăng nhập.",
        fieldErrors: validationErrors(parsed.error),
      },
      { status: 400 },
    );
  const { device, headers } = await getDevice(request);
  try {
    const res = await authApi.login(
      createPublicServerApi(request, context),
      { ...parsed.data, ...device },
      request.signal,
    );
    return await createUserSession({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      user: res.user,
      deviceId: device.deviceId,
      remember: form.get("remember") === "on",
      headers,
      redirectTo: String(form.get("redirectTo") ?? "/account"),
    });
  } catch (error) {
    if (isPendingAccountError(error)) {
      // Login only establishes verification context; never send an OTP here.
      return beginPendingVerification(
        {
          email: parsed.data.email,
          source: "login",
          remember: form.get("remember") === "on",
          redirectTo: safeRedirect(
            String(form.get("redirectTo") ?? "/account"),
          ),
        },
        headers,
      );
    }
    return authFormError(error, headers);
  }
}
export default function Login({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const form = useAuthForm(loginFormSchema);
  const errors = form.formState.errors;
  const remaining = useRetryCountdown(actionData?.retryAt);
  const redirectQuery = `?redirectTo=${encodeURIComponent(loaderData.redirectTo)}`;
  return (
    <AuthShell title="LOGIN" eyebrow="MEMBER ACCESS">
      <Form
        method="post"
        className="auth-form"
        noValidate
        onSubmit={form.onSubmit}
        aria-busy={form.busy}
      >
        <input type="hidden" name="redirectTo" value={loaderData.redirectTo} />
        {loaderData.notice ? (
          <p className="auth-form__notice" role="status">
            {loaderData.notice}
          </p>
        ) : null}
        {actionData?.error ? (
          <p className="auth-form__error" role="alert">
            {actionData.error}
          </p>
        ) : null}
        <AuthField
          label="Email"
          type="email"
          {...form.register("email")}
          placeholder="Email của bạn"
          required
          autoComplete="email"
          error={errors.email?.message ?? actionData?.fieldErrors.email}
        />
        <AuthField
          label="Mật khẩu"
          type="password"
          {...form.register("password")}
          placeholder="Mật khẩu"
          required
          autoComplete="current-password"
          error={errors.password?.message ?? actionData?.fieldErrors.password}
        />
        <div className="auth-form__options">
          <label className="auth-check">
            <input type="checkbox" name="remember" /> Ghi nhớ tôi
          </label>
        </div>
        <button
          className="auth-button"
          type="submit"
          disabled={form.busy || remaining > 0}
        >
          {form.busy
            ? "ĐANG ĐĂNG NHẬP…"
            : remaining > 0
              ? `THỬ LẠI SAU ${remaining}s`
              : "LOGIN"}
        </button>
        <button
          className="auth-button auth-button--secondary"
          type="button"
          disabled
          aria-disabled="true"
        >
          CONTINUE WITH GOOGLE
        </button>
        <p className="auth-form__switch">
          NEW HERE? <Link to={`/register${redirectQuery}`}>REGISTER</Link>
        </p>
      </Form>
    </AuthShell>
  );
}
