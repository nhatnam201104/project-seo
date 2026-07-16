import type { Config } from "@react-router/dev/config";

export default {
  // SSR bật cho toàn site: bắt buộc cho SEO (danh mục, sản phẩm, blog) theo PRD,
  // và là điều kiện để dùng httpOnly session-cookie bridge giữ JWT ở server.
  ssr: true,
} satisfies Config;
