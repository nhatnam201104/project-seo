import { Link } from "react-router";
import type { Route } from "./+types/admin";
import { RoleGate } from "~/components/rbac/RoleGate";
import { requireAdmin } from "~/lib/auth.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Quản trị — ProjectSale" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Chặn ở server: USER thường bị redirect về "/". Đây mới là hàng rào thật.
  const auth = await requireAdmin(request);
  return { user: auth.user };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  return (
    <main style={{ maxWidth: 720, margin: "6vh auto", padding: "0 16px" }}>
      <h1>Bảng điều khiển quản trị</h1>
      <p>Xin chào, {loaderData.user.full_name ?? loaderData.user.email}.</p>

      {/* RoleGate: ẩn/hiện UI theo role (chỉ UX; server đã chặn ở loader). */}
      <RoleGate
        role="ADMIN"
        fallback={<p>Bạn không có quyền xem khu vực này.</p>}
      >
        <ul>
          <li>Quản lý sản phẩm / biến thể / kho (TODO)</li>
          <li>Quản lý đơn hàng (TODO)</li>
          <li>Quản lý khuyến mãi, blog, duyệt đánh giá (TODO)</li>
        </ul>
      </RoleGate>

      <p style={{ marginTop: 20 }}>
        <Link to="/">← Trang chủ</Link>
      </p>
    </main>
  );
}
