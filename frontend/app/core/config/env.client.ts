import { z } from "zod";

/**
 * Cấu hình môi trường CLIENT-SAFE (được nhúng vào browser bundle).
 * Chỉ chứa biến `VITE_*` không nhạy cảm. Không đặt secret ở đây.
 */
const schema = z.object({
  appName: z.string().default("ProjectSale"),
  siteUrl: z.string().url().default("http://localhost:3000"),
});

export const clientEnv = schema.parse({
  appName: import.meta.env.VITE_APP_NAME,
  siteUrl: import.meta.env.VITE_SITE_URL,
});

export type ClientEnv = typeof clientEnv;
