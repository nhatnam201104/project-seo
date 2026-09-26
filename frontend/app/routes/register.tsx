import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/register";
import * as authApi from "~/features/auth/api/auth.api";
import { getAuth, safeRedirect } from "~/lib/auth.server";
import { createPublicServerApi } from "~/lib/http.server";
import { AuthField } from "~/components/storefront/AuthField";
import { AuthShell } from "~/components/storefront/AuthShell";
import {
  registerFormSchema,
  registerRequestSchema,
  validationErrors,
} from "~/features/auth/validation/auth.schema";
import { useAuthForm } from "~/features/auth/hooks/useAuthForm";
import { useRetryCountdown } from "~/features/auth/hooks/useRetryCountdown";
import {
  authFormError,
  type AuthActionData,
} from "~/features/auth/services/auth-form.server";
import { beginPendingVerification } from "~/features/auth/services/pending-verification.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Đăng ký — ProjectSale" }];
}
export async function loader({ request, context }: Route.LoaderArgs) {
  const redirectTo = safeRedirect(
    new URL(request.url).searchParams.get("redirectTo") ?? "/account",
  );
  const auth = await getAuth(request, context);
  if (auth.isAuthenticated) throw redirect(redirectTo);
  return { redirectTo };
}
export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const parsed = registerFormSchema.safeParse({
    full_name: form.get("full_name") ?? "",
    email: form.get("email") ?? "",
    phone: form.get("phone") ?? "",
    password: form.get("password") ?? "",
    confirm_password: form.get("confirm_password") ?? "",
    terms: form.get("terms") === "on",
  });
  if (!parsed.success)
    return data<AuthActionData>(
      {
        error: "Vui lòng kiểm tra lại thông tin đăng ký.",
        fieldErrors: validationErrors(parsed.error),
      },
      { status: 400 },
    );
  try {
    await authApi.register(
      createPublicServerApi(request, context),
      registerRequestSchema.parse(parsed.data),
      request.signal,
    );
    return beginPendingVerification({
      email: parsed.data.email,
      source: "register",
      remember: false,
      redirectTo: safeRedirect(String(form.get("redirectTo") ?? "/account")),
    });
  } catch (error) {
    return authFormError(error);
  }
}
export default function Register({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const form = useAuthForm(registerFormSchema, { terms: false });
  const errors = form.formState.errors;
  const remaining = useRetryCountdown(actionData?.retryAt);
  const redirectQuery = `?redirectTo=${encodeURIComponent(loaderData.redirectTo)}`;
  return (
    <AuthShell title="REGISTER" eyebrow="CREATE ACCOUNT">
      <Form
        method="post"
        className="auth-form"
        noValidate
        onSubmit={form.onSubmit}
        aria-busy={form.busy}
      >
        <input type="hidden" name="redirectTo" value={loaderData.redirectTo} />
        {actionData?.error ? (
          <p className="auth-form__error" role="alert">
            {actionData.error}
          </p>
        ) : null}
        <AuthField
          label="Họ và tên"
          {...form.register("full_name")}
          placeholder="Tên của bạn"
          required
          maxLength={120}
          autoComplete="name"
          error={errors.full_name?.message ?? actionData?.fieldErrors.full_name}
        />
        <AuthField
          label="Email"
          type="email"
          {...form.register("email")}
          placeholder="Email của bạn"
          required
          maxLength={190}
          autoComplete="email"
          error={errors.email?.message ?? actionData?.fieldErrors.email}
        />
        <AuthField
          label="Số điện thoại"
          type="tel"
          {...form.register("phone")}
          placeholder="0901234567 hoặc +84901234567"
          required
          autoComplete="tel"
          error={errors.phone?.message ?? actionData?.fieldErrors.phone}
        />
        <AuthField
          label="Mật khẩu"
          type="password"
          {...form.register("password")}
          placeholder="Từ 8 đến 72 ký tự"
          required
          maxLength={72}
          autoComplete="new-password"
          error={errors.password?.message ?? actionData?.fieldErrors.password}
        />
        <AuthField
          label="Xác nhận mật khẩu"
          type="password"
          {...form.register("confirm_password")}
          placeholder="Nhập lại mật khẩu"
          required
          maxLength={72}
          autoComplete="new-password"
          error={
            errors.confirm_password?.message ??
            actionData?.fieldErrors.confirm_password
          }
        />
        <div>
          <label className="auth-check">
            <input
              type="checkbox"
              {...form.register("terms")}
              required
              aria-describedby="terms-error"
            />{" "}
            Tôi đồng ý với điều khoản và chính sách riêng tư.
          </label>
          {errors.terms?.message || actionData?.fieldErrors.terms ? (
            <p id="terms-error" className="auth-field--error" role="alert">
              {errors.terms?.message ?? actionData?.fieldErrors.terms}
            </p>
          ) : null}
        </div>
        <button
          className="auth-button"
          type="submit"
          disabled={form.busy || remaining > 0}
        >
          {form.busy
            ? "ĐANG TẠO TÀI KHOẢN…"
            : remaining > 0
              ? `THỬ LẠI SAU ${remaining}s`
              : "CREATE ACCOUNT"}
        </button>
        <p className="auth-form__switch">
          ALREADY A MEMBER? <Link to={`/login${redirectQuery}`}>LOGIN</Link>
        </p>
      </Form>
    </AuthShell>
  );
}
