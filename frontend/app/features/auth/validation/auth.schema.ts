import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập email.")
  .email("Email không hợp lệ.");
const password = z
  .string()
  .refine((value) => value.trim().length > 0, "Vui lòng nhập mật khẩu.");

export const deviceSchema = z.object({
  deviceId: z.string().uuid("Device ID không hợp lệ."),
  deviceName: z.string().max(120).optional(),
  platform: z
    .enum(["IOS", "ANDROID", "WINDOWS", "MACOS", "LINUX", "OTHER", "UNKNOWN"])
    .optional(),
});
export const loginFormSchema = z.object({ email, password });
export const loginRequestSchema = loginFormSchema.merge(deviceSchema);
export const registerRequestSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên.")
    .max(120, "Họ tên tối đa 120 ký tự."),
  email: email.max(190, "Email tối đa 190 ký tự."),
  phone: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số điện thoại.")
    .regex(
      /^(0|\+84)(3|5|7|8|9)\d{8}$/,
      "Số điện thoại Việt Nam không hợp lệ.",
    ),
  password: password.pipe(
    z
      .string()
      .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
      .max(72, "Mật khẩu tối đa 72 ký tự."),
  ),
});
export const registerFormSchema = registerRequestSchema
  .extend({
    confirm_password: z.string(),
    terms: z.boolean().refine(Boolean, "Bạn cần đồng ý với điều khoản."),
  })
  .refine((value) => value.password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Mật khẩu xác nhận chưa khớp.",
  });
export const resendOtpRequestSchema = z.object({ email });
export const verifyFormSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP phải gồm 6 chữ số."),
});
export const verifyRequestSchema = verifyFormSchema
  .merge(resendOtpRequestSchema)
  .merge(deviceSchema);
export const pendingVerificationSchema = z.object({
  email,
  flowId: z.string().uuid(),
  source: z.enum(["register", "login"]),
  expiresAt: z.number().int().positive(),
  resendAvailableAt: z.number().int().nonnegative().optional(),
  lastSentAt: z.number().int().positive().optional(),
  redirectTo: z.string().startsWith("/"),
  remember: z.boolean(),
});
export type PendingVerification = z.infer<typeof pendingVerificationSchema>;
export const refreshRequestSchema = z.object({
  refresh_token: z.string().min(1),
});
export const logoutRequestSchema = refreshRequestSchema.extend({
  deviceId: deviceSchema.shape.deviceId,
});
export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
});
export const tokenPairSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});
export const tokenResponseSchema = tokenPairSchema.extend({
  user: authUserSchema,
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type VerifyFormValues = z.infer<typeof verifyFormSchema>;

export function validationErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const name = issue.path[0];
    if (typeof name === "string" && !fields[name]) fields[name] = issue.message;
  }
  return fields;
}
