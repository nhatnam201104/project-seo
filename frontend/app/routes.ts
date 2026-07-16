import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  // Trang chủ = danh sách sản phẩm (feature mẫu: read qua loader + Page<T>)
  index("routes/home.tsx"),

  // Auth — minh hoạ httpOnly session-cookie bridge
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),

  // Trang cần đăng nhập — minh hoạ requireUser()
  route("account", "routes/account.tsx"),

  // Trang chỉ ADMIN — minh hoạ requireAdmin()
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
