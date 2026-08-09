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
    // UI prototype công khai, chỉ dùng mock. Khôi phục guard trước khi nối API thật.
    route("admin", "routes/admin.tsx"),
    route("admin/products", "routes/admin.products.tsx"),
    route("admin/orders", "routes/admin.orders.tsx"),
    route("admin/catalog", "routes/admin.catalog.tsx"),
    route("admin/promotions", "routes/admin.promotions.tsx"),
    route("admin/blog", "routes/admin.blog.tsx"),
    route("admin/reviews", "routes/admin.reviews.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
  ]),
] satisfies RouteConfig;
