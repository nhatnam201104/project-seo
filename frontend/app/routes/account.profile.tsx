import { useEffect } from "react";
import { data, Form, useNavigation } from "react-router";
import type { Route } from "./+types/account.profile";
import { requireUser } from "~/lib/auth.server";
import { actionErrorMessage, isEndpointMissing } from "~/lib/action-error.server";
import { AccountShell, PageHeading } from "~/components/store/AccountShell";
import { UnderlineField } from "~/components/store/UnderlineField";
import * as profileApi from "~/features/profile/api/profile.api";
import type { Gender, Profile } from "~/features/profile/api/profile.types";
import {
  changePasswordSchema,
  MIN_BIRTH_YEAR,
  todayIso,
  updateProfileSchema,
  validateAvatar,
  PASSWORD_MIN,
} from "~/features/profile/validation/profile.schema";
import { useNotificationStore } from "~/stores";
import { validationErrors } from "~/features/auth/validation/auth.schema";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Chỉnh sửa hồ sơ — ProjectSale" }];
}

type Intent = "profile" | "password" | "avatar";
type ActionData = { intent: Intent; ok?: boolean; error?: string; fieldErrors: Record<string, string> };

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireUser(request, context);
  let profile: Profile;
  let unavailable = false;
  try {
    profile = await profileApi.getProfile(auth.client, request.signal);
  } catch (error) {
    if (!isEndpointMissing(error)) throw error;
    // Backend chưa có /users/me: hiển thị thông tin cơ bản từ phiên đăng nhập.
    unavailable = true;
    profile = {
      id: auth.user.id, email: auth.user.email, full_name: auth.user.full_name, phone: auth.user.phone,
      date_of_birth: null, gender: null, avatar_url: null,
    };
  }
  const setCookie = await auth.commit();
  return data({ profile, unavailable }, setCookie ? { headers: { "Set-Cookie": setCookie } } : undefined);
}

export async function action({ request, context }: Route.ActionArgs) {
  const auth = await requireUser(request, context);
  const form = await request.formData();
  const intent = String(form.get("intent")) as Intent;
  const respond = async (body: ActionData, status = 200) => {
    const setCookie = await auth.commit();
    return data(body, { status, headers: setCookie ? { "Set-Cookie": setCookie } : undefined });
  };

  try {
    if (intent === "profile") {
      const gender = String(form.get("gender") ?? "");
      const parsed = updateProfileSchema.safeParse({
        full_name: form.get("full_name") ?? "",
        phone: form.get("phone") ?? "",
        date_of_birth: form.get("date_of_birth") ?? "",
        gender: gender === "" ? null : gender,
      });
      if (!parsed.success) return respond({ intent, fieldErrors: validationErrors(parsed.error) }, 400);
      await profileApi.updateProfile(auth.client, parsed.data, request.signal);
      return respond({ intent, ok: true, fieldErrors: {} });
    }
    if (intent === "password") {
      const parsed = changePasswordSchema.safeParse({
        current_password: form.get("current_password") ?? "",
        new_password: form.get("new_password") ?? "",
        confirm_password: form.get("confirm_password") ?? "",
      });
      if (!parsed.success) return respond({ intent, fieldErrors: validationErrors(parsed.error) }, 400);
      await profileApi.changePassword(auth.client, { current_password: parsed.data.current_password, new_password: parsed.data.new_password }, request.signal);
      return respond({ intent, ok: true, fieldErrors: {} });
    }
    if (intent === "avatar") {
      const file = form.get("avatar");
      if (!(file instanceof File) || file.size === 0) return respond({ intent, fieldErrors: { avatar: "Vui lòng chọn ảnh." } }, 400);
      const problem = validateAvatar(file);
      if (problem) return respond({ intent, fieldErrors: { avatar: problem } }, 400);
      await profileApi.uploadAvatar(auth.client, file, request.signal);
      return respond({ intent, ok: true, fieldErrors: {} });
    }
    return respond({ intent, error: "Yêu cầu không hợp lệ.", fieldErrors: {} }, 400);
  } catch (error) {
    const { status, message } = actionErrorMessage(error);
    // 409: số điện thoại đã thuộc tài khoản khác → báo ngay tại ô nhập.
    if (intent === "profile" && status === 409) return respond({ intent, fieldErrors: { phone: message } }, status);
    return respond({ intent, error: message, fieldErrors: {} }, status);
  }
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const SUCCESS_MESSAGES: Record<Intent, string> = {
  profile: "Đã lưu hồ sơ",
  password: "Đã đổi mật khẩu",
  avatar: "Đã cập nhật ảnh đại diện",
};

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.split(/\s+/).slice(-2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function EditProfile({ loaderData, actionData }: Route.ComponentProps) {
  const { profile, unavailable } = loaderData;
  const navigation = useNavigation();
  const busyIntent = navigation.state === "submitting" ? String(navigation.formData?.get("intent")) : null;
  const result = actionData as ActionData | undefined;
  const errorsFor = (intent: Intent) => (result?.intent === intent ? result.fieldErrors : {});
  const bannerFor = (intent: Intent) => (result?.intent === intent ? result : undefined);
  const profileBanner = bannerFor("profile");
  const passwordBanner = bannerFor("password");
  const avatarBanner = bannerFor("avatar");
  const pushToast = useNotificationStore((s) => s.push);

  useEffect(() => {
    if (result?.ok) pushToast("success", SUCCESS_MESSAGES[result.intent]);
  }, [result, pushToast]);

  return (
    <AccountShell active="settings">
      <PageHeading back={{ to: "/account", label: "Về tổng quan" }} title="Edit profile." lead="Cập nhật thông tin cá nhân và bảo mật tài khoản." />
      {unavailable ? <p className="sp-alert sp-alert--error" role="status" style={{ marginTop: 24 }}>Chưa tải được đầy đủ hồ sơ (ngày sinh, giới tính, ảnh). Bạn vẫn có thể xem thông tin cơ bản.</p> : null}

      <section className="sp-section" aria-labelledby="personal-heading">
        <header><h2 id="personal-heading">Thông tin cá nhân</h2><span>Hồ sơ</span></header>

        <Form method="post" encType="multipart/form-data" className="sp-avatar" aria-label="Ảnh đại diện">
          <input type="hidden" name="intent" value="avatar" />
          <div className="sp-avatar__img">{profile.avatar_url ? <img src={profile.avatar_url} alt="Ảnh đại diện" /> : initials(profile.full_name, profile.email)}</div>
          <div>
            <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh đại diện" aria-invalid={Boolean(errorsFor("avatar").avatar)} />
            <p>JPG, PNG hoặc WEBP. Tối đa 2MB.</p>
            {errorsFor("avatar").avatar ? <p className="sp-field__msg--error" role="alert">{errorsFor("avatar").avatar}</p> : null}
            {avatarBanner?.error ? <p className="sp-field__msg--error" role="alert">{avatarBanner.error}</p> : null}
          </div>
          <button className="sp-link" type="submit" disabled={busyIntent === "avatar"}>{busyIntent === "avatar" ? "Đang tải…" : "Đổi ảnh"}</button>
        </Form>

        <Form method="post" className="sp-section" style={{ border: 0, margin: 0, padding: 0 }} aria-busy={busyIntent === "profile"}>
          <input type="hidden" name="intent" value="profile" />
          {profileBanner?.error ? <p className="sp-alert sp-alert--error" role="alert">{profileBanner.error}</p> : null}
          <div className="sp-form-grid">
            <UnderlineField label="Họ và tên" name="full_name" required defaultValue={profile.full_name ?? ""} autoComplete="name" hint="Tên hiển thị trên đơn hàng" error={errorsFor("profile").full_name} />
            <UnderlineField label="Email" name="email" type="email" defaultValue={profile.email} disabled hint="Email không thể thay đổi" />
            <UnderlineField label="Số điện thoại" name="phone" type="tel" defaultValue={profile.phone ?? ""} autoComplete="tel" hint="Dùng để xác nhận giao hàng" error={errorsFor("profile").phone} />
            <UnderlineField label="Ngày sinh" name="date_of_birth" type="date" defaultValue={profile.date_of_birth ?? ""} min={`${MIN_BIRTH_YEAR}-01-01`} max={todayIso()} autoComplete="bday" error={errorsFor("profile").date_of_birth} />
          </div>
          <fieldset className="sp-field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ color: "var(--sf-muted)", fontSize: ".8rem", fontWeight: 700, padding: 0, marginBottom: 8 }}>Giới tính</legend>
            <div className="sp-chips">
              {GENDERS.map((g) => (
                <label key={g.value} className="sp-chip"><input type="radio" name="gender" value={g.value} defaultChecked={profile.gender === g.value} /><span>{g.label}</span></label>
              ))}
            </div>
          </fieldset>
          <div className="sp-actions"><button className="sp-btn" type="submit" disabled={busyIntent === "profile"}>{busyIntent === "profile" ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
        </Form>
      </section>

      <section className="sp-section" id="password" aria-labelledby="password-heading">
        <header><h2 id="password-heading">Đổi mật khẩu</h2><span>Bảo mật</span></header>
        <Form method="post" key={passwordBanner?.ok ? "done" : "form"} className="sp-form-grid" style={{ gridTemplateColumns: "1fr" }} aria-busy={busyIntent === "password"}>
          <input type="hidden" name="intent" value="password" />
          {passwordBanner?.error ? <p className="sp-alert sp-alert--error" role="alert">{passwordBanner.error}</p> : null}
          <UnderlineField className="sp-narrow" label="Mật khẩu hiện tại" name="current_password" type="password" required autoComplete="current-password" error={errorsFor("password").current_password} />
          <UnderlineField className="sp-narrow" label="Mật khẩu mới" name="new_password" type="password" required autoComplete="new-password" placeholder="Nhập mật khẩu mới" hint={`Tối thiểu ${PASSWORD_MIN} ký tự, gồm chữ thường và chữ số`} error={errorsFor("password").new_password} />
          <UnderlineField className="sp-narrow" label="Xác nhận mật khẩu mới" name="confirm_password" type="password" required autoComplete="new-password" error={errorsFor("password").confirm_password} />
          <div className="sp-actions"><button className="sp-btn" type="submit" disabled={busyIntent === "password"}>{busyIntent === "password" ? "Đang lưu…" : "Đổi mật khẩu"}</button></div>
        </Form>
      </section>
      <div style={{ height: 64 }} />
    </AccountShell>
  );
}
