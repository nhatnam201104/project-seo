import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/register";
import { isApiError } from "~/core/api";
import * as authApi from "~/features/auth/api/auth.api";
import { createUserSession, getAuth } from "~/lib/auth.server";
import { publicServerApi } from "~/lib/http.server";
import { AuthField } from "~/components/storefront/AuthField";
import { AuthShell } from "~/components/storefront/AuthShell";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Đăng ký — ProjectSale" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (auth.isAuthenticated) throw redirect("/account");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const fullName = String(form.get("full_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirm_password") ?? "");
  const acceptedTerms = form.get("terms") === "on";
  const fieldErrors = {
    full_name: fullName ? undefined : "Vui lòng nhập họ và tên.",
    email: email ? undefined : "Vui lòng nhập email.",
    password: password.length >= 8 ? undefined : "Mật khẩu cần ít nhất 8 ký tự.",
    confirm_password: password === confirmPassword ? undefined : "Mật khẩu xác nhận chưa khớp.",
    terms: acceptedTerms ? undefined : "Bạn cần đồng ý với điều khoản.",
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return data({ error: "Vui lòng kiểm tra lại thông tin đăng ký.", fieldErrors }, { status: 400 });
  }

  try {
    const res = await authApi.register(publicServerApi, {
      email,
      password,
      full_name: fullName,
      ...(phone ? { phone } : {}),
    }, request.signal);
    return createUserSession({ accessToken: res.access_token, refreshToken: res.refresh_token, user: res.user, redirectTo: "/account" });
  } catch (error) {
    const message = isApiError(error) ? error.message : "Đăng ký thất bại.";
    const status = isApiError(error) && error.status ? error.status : 400;
    return data({
      error: message,
      fieldErrors: {
        full_name: undefined,
        email: undefined,
        password: undefined,
        confirm_password: undefined,
        terms: undefined,
      },
    }, { status });
  }
}

export default function Register({ actionData }: Route.ComponentProps) {
  return (
    <AuthShell title="REGISTER" eyebrow="CREATE ACCOUNT">
      <Form method="post" className="auth-form">
        {actionData?.error ? <p className="auth-form__error" role="alert">{actionData.error}</p> : null}
        <AuthField label="Họ và tên" name="full_name" placeholder="Tên của bạn" required autoComplete="name" error={actionData?.fieldErrors?.full_name} />
        <AuthField label="Email" type="email" name="email" placeholder="Email của bạn" required autoComplete="email" error={actionData?.fieldErrors?.email} />
        <AuthField label="Số điện thoại (không bắt buộc)" type="tel" name="phone" placeholder="+84" autoComplete="tel" />
        <AuthField label="Mật khẩu" type="password" name="password" placeholder="Tối thiểu 8 ký tự" required autoComplete="new-password" error={actionData?.fieldErrors?.password} />
        <AuthField label="Xác nhận mật khẩu" type="password" name="confirm_password" placeholder="Nhập lại mật khẩu" required autoComplete="new-password" error={actionData?.fieldErrors?.confirm_password} />
        <div>
          <label className="auth-check"><input type="checkbox" name="terms" required /> Tôi đồng ý với điều khoản và chính sách riêng tư.</label>
          {actionData?.fieldErrors?.terms ? <p className="auth-field--error" role="alert">{actionData.fieldErrors.terms}</p> : null}
        </div>
        <button className="auth-button" type="submit">CREATE ACCOUNT</button>
        <button className="auth-button auth-button--secondary" type="button" disabled aria-disabled="true">CONTINUE WITH GOOGLE</button>
        <p className="auth-form__switch">ALREADY A MEMBER? <Link to="/login">LOGIN</Link></p>
      </Form>
    </AuthShell>
  );
}
