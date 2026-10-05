import { z } from "zod";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const phone = z
  .string()
  .trim()
  .regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, "Số điện thoại Việt Nam không hợp lệ.");

/** "24/10/1995" → "1995-10-24"; chuỗi rỗng → null; sai định dạng/ngày không tồn tại → undefined. */
export function parseVnDate(value: string): string | null | undefined {
  const text = value.trim();
  if (!text) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  const valid =
    d.getUTCFullYear() === Number(yyyy) &&
    d.getUTCMonth() === Number(mm) - 1 &&
    d.getUTCDate() === Number(dd);
  if (!valid || d.getTime() > Date.now()) return undefined;
  return `${yyyy}-${mm}-${dd}`;
}

/** "1995-10-24" → "24/10/1995" (hiển thị). */
export function formatVnDate(iso: string | null | undefined): string {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên.")
    .max(120, "Họ tên tối đa 120 ký tự."),
  phone: z.union([z.literal(""), phone]).transform((v) => (v === "" ? null : v)),
  date_of_birth: z
    .string()
    .transform((v, ctx) => {
      const iso = parseVnDate(v);
      if (iso === undefined) {
        ctx.addIssue({ code: "custom", message: "Ngày sinh không hợp lệ (DD/MM/YYYY)." });
        return z.NEVER;
      }
      return iso;
    }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable(),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    new_password: z
      .string()
      .min(PASSWORD_MIN, `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`)
      .max(PASSWORD_MAX, `Mật khẩu tối đa ${PASSWORD_MAX} ký tự.`)
      .regex(/^(?=.*[a-z])(?=.*\d).+$/, "Mật khẩu cần có chữ thường và chữ số."),
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Mật khẩu xác nhận không khớp.",
  });

export function validateAvatar(file: File): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return "Ảnh phải là JPG, PNG hoặc WEBP.";
  if (file.size > AVATAR_MAX_BYTES) return "Ảnh tối đa 2MB.";
  return null;
}
