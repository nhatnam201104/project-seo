import { z } from "zod";

/**
 * Cấu hình môi trường SERVER-ONLY, đã validate.
 *
 * File có hậu tố `.server` nên React Router loại nó khỏi client bundle —
 * an toàn để chứa secret (SESSION_SECRET, API_BASE_URL nội bộ).
 *
 * KHÔNG đọc `process.env` trực tiếp ở nơi khác; luôn import `serverEnv` từ đây.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_BASE_URL: z.string().url(),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET phải dài ít nhất 32 ký tự"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  // Bí mật dùng chung với backend (app.proxy.shared-secret). Chứng minh request đến
  // từ SSR để backend tin IP/User-Agent của trình duyệt được chuyển tiếp.
  INTERNAL_PROXY_SECRET: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(
      z
        .string()
        .min(32, "INTERNAL_PROXY_SECRET phải dài ít nhất 32 ký tự")
        .optional(),
    ),
}).superRefine((env, ctx) => {
  // Thiếu bí mật ở production: backend coi mọi người dùng là một (IP của SSR)
  // → một người gõ sai mật khẩu vài lần sẽ khoá đăng nhập của tất cả.
  if (env.NODE_ENV === "production" && !env.INTERNAL_PROXY_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["INTERNAL_PROXY_SECRET"],
      message: "INTERNAL_PROXY_SECRET bắt buộc khi NODE_ENV=production",
    });
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast khi thiếu cấu hình — không cho app chạy với env sai.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`[env.server] Biến môi trường không hợp lệ:\n${issues}`);
}

export const serverEnv = {
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === "production",
  apiBaseUrl: parsed.data.API_BASE_URL,
  sessionSecret: parsed.data.SESSION_SECRET,
  cookieSecure: parsed.data.COOKIE_SECURE,
  apiTimeoutMs: parsed.data.API_TIMEOUT_MS,
  internalProxySecret: parsed.data.INTERNAL_PROXY_SECRET,
} as const;

export type ServerEnv = typeof serverEnv;
