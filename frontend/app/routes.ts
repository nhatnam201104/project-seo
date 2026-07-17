import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  // Trang chủ = landing page campaign (editorial, không phụ thuộc backend)
  index("routes/landing.tsx"),

  layout("layouts/client-layout.tsx", [
    // Danh sách sản phẩm (feature mẫu: read qua loader + Page<T>)
    route("products", "routes/products.tsx"),

    // Auth — minh hoạ httpOnly session-cookie bridge
    route("login", "routes/login.tsx"),

    // Trang cần đăng nhập — minh hoạ requireUser()
    route("account", "routes/account.tsx"),
  ]),

  // Resource route: chỉ action/redirect, không cần UI shell.
  route("logout", "routes/logout.tsx"),

  layout("layouts/admin-layout.tsx", [
    // Mỗi leaf loader đặc quyền vẫn tự requireAdmin().
    route("admin", "routes/admin.tsx"),
  ]),
] satisfies RouteConfig;
