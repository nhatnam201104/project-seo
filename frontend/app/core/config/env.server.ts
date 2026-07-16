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
} as const;

export type ServerEnv = typeof serverEnv;
