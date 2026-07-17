import { data } from "react-router";
import type { Route } from "./+types/account";
import * as authApi from "~/features/auth/api/auth.api";
import { requireUser } from "~/lib/auth.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Tài khoản — ProjectSale" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // requireUser → ném redirect /login nếu chưa đăng nhập.
  const auth = await requireUser(request);

  // Gọi API có auth qua bridge; nếu access token hết hạn, refresh tự chạy.
  const me = await authApi.getMe(auth.client, request.signal);

  // Nếu vừa refresh, ghi token mới vào session cookie (Set-Cookie).
  const setCookie = await auth.commit();
  return data(
    { me },
    setCookie ? { headers: { "Set-Cookie": setCookie } } : undefined,
  );
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { me } = loaderData;
  return (
    <section style={{ maxWidth: 560, margin: "3vh auto" }} aria-labelledby="account-heading">
      <h1 id="account-heading">Tài khoản</h1>
      <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
        <dt>Email</dt>
        <dd>{me.email}</dd>
        <dt>Họ tên</dt>
        <dd>{me.full_name ?? "—"}</dd>
        <dt>Điện thoại</dt>
        <dd>{me.phone ?? "—"}</dd>
        <dt>Vai trò</dt>
        <dd>{me.role}</dd>
      </dl>
    </section>
  );
}
