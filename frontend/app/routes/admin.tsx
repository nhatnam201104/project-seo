import type { Route } from "./+types/admin";
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
    <section style={{ maxWidth: 720, margin: "3vh auto" }} aria-labelledby="admin-heading">
      <h1 id="admin-heading">Bảng điều khiển quản trị</h1>
      <p>Xin chào, {loaderData.user.full_name ?? loaderData.user.email}.</p>

      <ul>
        <li>Quản lý sản phẩm / biến thể / kho (TODO)</li>
        <li>Quản lý đơn hàng (TODO)</li>
        <li>Quản lý khuyến mãi, blog, duyệt đánh giá (TODO)</li>
      </ul>
    </section>
  );
}
