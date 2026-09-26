import { data, Form, redirect, useSubmit } from "react-router";
import { useEffect, type FormEvent } from "react";
import type { Route } from "./+types/verify";
import { isApiError } from "~/core/api";
import * as authApi from "~/features/auth/api/auth.api";
import { createUserSession, getAuth, safeRedirect } from "~/lib/auth.server";
import { createPublicServerApi } from "~/lib/http.server";
import { AuthField } from "~/components/storefront/AuthField";
import { AuthShell } from "~/components/storefront/AuthShell";
import {
  verifyFormSchema,
  validationErrors,
} from "~/features/auth/validation/auth.schema";
import { useAuthForm } from "~/features/auth/hooks/useAuthForm";
import { useRetryCountdown } from "~/features/auth/hooks/useRetryCountdown";
import {
  authFormError,
  type AuthActionData,
} from "~/features/auth/services/auth-form.server";

import {
  requirePendingVerification,
  clearPendingVerification,
  savePendingVerification,
  maskEmail,
} from "~/features/auth/services/pending-verification.server";
import { getDevice } from "~/features/auth/services/device.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Xác thực email — ProjectSale" }];
}
export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await getAuth(request, context);
  if (auth.isAuthenticated)
    throw redirect("/account", {
      headers: { "Set-Cookie": await clearPendingVerification() },
    });
  const pending = await requirePendingVerification(request);
  const { headers } = await getDevice(request);
  headers.set("Cache-Control", "no-store");
  return data(
    {
      maskedEmail: maskEmail(pending.email),
      flowId: pending.flowId,
      source: pending.source,
      expiresAt: pending.expiresAt,
      resendAvailableAt: pending.resendAvailableAt,
      lastSentAt: pending.lastSentAt,
    },
    { headers },
  );
}
export async function action({ request, context }: Route.ActionArgs) {
  const pending = await requirePendingVerification(request);
  const form = await request.formData();
  const headers = new Headers({ "Cache-Control": "no-store" });
  // Never accept email/redirect/remember overrides from form data or the URL.
  if (form.get("flowId") !== pending.flowId)
    return data<AuthActionData>(
      {
        error:
          "Phiên xác thực đã thay đổi ở tab khác. Hãy tải lại trang để tiếp tục.",
        fieldErrors: {},
        reloadRequired: true,
      },
      { status: 409, headers },
    );
  const intent = form.get("intent") ?? "verify";
  if (intent === "cancel") {
    headers.append("Set-Cookie", await clearPendingVerification());
    return redirect(
      `/login?verification=cancelled&redirectTo=${encodeURIComponent(safeRedirect(pending.redirectTo))}`,
      { headers },
    );
  }
  if (intent !== "verify" && intent !== "resend")
    return data<AuthActionData>(
      { error: "Thao tác không hợp lệ.", fieldErrors: {} },
      { status: 400, headers },
    );
  if (intent === "resend") {
    if ((pending.resendAvailableAt ?? 0) > Date.now())
      return data<AuthActionData>(
        {
          error: "Vui lòng chờ trước khi gửi lại mã.",
          fieldErrors: {},
          resendAvailableAt: pending.resendAvailableAt,
        },
        { status: 429, headers },
      );
    try {
      await authApi.resendOtp(
        createPublicServerApi(request, context),
        { email: pending.email },
        request.signal,
      );
      pending.lastSentAt = Date.now();
      pending.resendAvailableAt = pending.lastSentAt + 300_000;
      headers.append("Set-Cookie", await savePendingVerification(pending));
      return data<AuthActionData>(
        {
          message:
            "Đã gửi lại OTP. Vui lòng kiểm tra email; mã có hiệu lực trong 5 phút.",
          fieldErrors: {},
          resendAvailableAt: pending.resendAvailableAt,
          otpResetKey: pending.lastSentAt,
        },
        { headers },
      );
    } catch (error) {
      if (isApiError(error) && error.status === 429) {
        pending.resendAvailableAt =
          Date.now() + (error.retryAfter ?? 60) * 1000;
        headers.append("Set-Cookie", await savePendingVerification(pending));
      }
      const failure = authFormError(error, headers);
      // A resend throttle must not prevent the user from verifying an existing OTP.
      return data<AuthActionData>(
        {
          ...failure.data,
          retryAt: undefined,
          resendAvailableAt: pending.resendAvailableAt,
        },
        failure.init ?? undefined,
      );
    }
  }
  const parsed = verifyFormSchema.safeParse({ otp: form.get("otp") ?? "" });
  if (!parsed.success)
    return data<AuthActionData>(
      {
        error: "Vui lòng kiểm tra mã xác thực.",
        fieldErrors: validationErrors(parsed.error),
      },
      { status: 400, headers },
    );
  const deviceContext = await getDevice(request);
  for (const cookie of deviceContext.headers.getSetCookie())
    headers.append("Set-Cookie", cookie);
  try {
    const res = await authApi.verify(
      createPublicServerApi(request, context),
      { email: pending.email, ...parsed.data, ...deviceContext.device },
      request.signal,
    );
    return await createUserSession({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      user: res.user,
      deviceId: deviceContext.device.deviceId,
      headers,
      redirectTo: safeRedirect(pending.redirectTo),
      remember: pending.remember,
    });
  } catch (error) {
    return authFormError(error, headers);
  }
}
export default function Verify({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  // A different flow remounts the form and clears any code entered for the old account.
  return (
    <VerificationForm
      key={loaderData.flowId}
      actionData={actionData}
      loaderData={loaderData}
    />
  );
}
function VerificationForm({
  actionData,
  loaderData,
}: Pick<Route.ComponentProps, "actionData" | "loaderData">) {
  const form = useAuthForm(verifyFormSchema, { otp: "" });
  const errors = form.formState.errors;
  const submit = useSubmit();
  const remaining = useRetryCountdown(
    Math.max(
      loaderData.resendAvailableAt ?? 0,
      actionData?.resendAvailableAt ?? 0,
    ),
  );
  const verifyRemaining = useRetryCountdown(actionData?.retryAt);
  const resetKey = actionData?.otpResetKey ?? loaderData.lastSentAt;
  const resetField = form.resetField;
  useEffect(() => {
    resetField("otp");
  }, [resetKey, resetField]);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const button = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const intent = button?.value ?? "verify";
    if (intent === "verify") {
      if (verifyRemaining > 0 || actionData?.reloadRequired) {
        event.preventDefault();
        return;
      }
      return form.onSubmit(event);
    }
    event.preventDefault();
    if (
      form.busy ||
      actionData?.reloadRequired ||
      (intent === "resend" && remaining > 0)
    )
      return;
    form.clearErrors();
    void submit({ flowId: loaderData.flowId, intent }, { method: "post" });
  }
  return (
    <AuthShell title="VERIFY" eyebrow="EMAIL VERIFICATION">
      <Form
        method="post"
        className="auth-form"
        noValidate
        onSubmit={onSubmit}
        aria-busy={form.busy}
      >
        <input type="hidden" name="flowId" value={loaderData.flowId} />
        <p className="auth-form__notice">
          {loaderData.source === "register" ? (
            <>
              Mã xác thực đã được gửi đến{" "}
              <strong>{loaderData.maskedEmail}</strong>. Nhập mã OTP gồm 6 chữ
              số; mã có hiệu lực trong 5 phút.
            </>
          ) : (
            <>
              Tài khoản <strong>{loaderData.maskedEmail}</strong> chưa được xác
              thực. Nhập mã đã nhận hoặc gửi lại mã nếu mã đã hết hạn.
            </>
          )}
        </p>
        {actionData?.error ? (
          <p className="auth-form__error" role="alert">
            {actionData.error}
          </p>
        ) : null}
        {actionData?.message ? (
          <p className="auth-form__notice" role="status">
            {actionData.message}
          </p>
        ) : null}
        {actionData?.reloadRequired ? (
          <a href="/verify">Tải lại trang xác thực</a>
        ) : null}
        <AuthField
          label="Mã OTP"
          {...form.register("otp")}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          required
          error={errors.otp?.message ?? actionData?.fieldErrors.otp}
        />
        <button
          className="auth-button"
          type="submit"
          name="intent"
          value="verify"
          disabled={
            form.busy || actionData?.reloadRequired || verifyRemaining > 0
          }
        >
          {form.busy
            ? "ĐANG XỬ LÝ…"
            : verifyRemaining > 0
              ? `THỬ LẠI SAU ${verifyRemaining}s`
              : "XÁC THỰC EMAIL"}
        </button>
        <button
          className="auth-button auth-button--secondary"
          type="submit"
          name="intent"
          value="resend"
          formNoValidate
          disabled={form.busy || actionData?.reloadRequired || remaining > 0}
        >
          {remaining > 0 ? `GỬI LẠI SAU ${remaining}s` : "GỬI LẠI MÃ"}
        </button>
        <button
          className="auth-button auth-button--secondary"
          type="submit"
          name="intent"
          value="cancel"
          formNoValidate
          disabled={form.busy || actionData?.reloadRequired}
        >
          Quay lại đăng nhập
        </button>
      </Form>
    </AuthShell>
  );
}
