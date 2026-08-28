import { data, Form, Link } from "react-router";
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
  const firstName = me.full_name?.trim().split(/\s+/).at(-1) ?? me.email.split("@")[0] ?? "MEMBER";
  return (
    <section className="account-page" aria-labelledby="account-heading">
      <div className="account-page__layout">
        <nav className="account-nav" aria-label="Điều hướng tài khoản">
          <p>MY ACCOUNT / 01</p>
          <Link to="/account">Overview</Link><a href="#orders">Orders</a><a href="#saved">Saved items</a><a href="#settings">Settings</a>
          <Form method="post" action="/logout"><button type="submit">Logout</button></Form>
        </nav>
        <div className="account-main">
          <p className="account-main__kicker">ACCOUNT OVERVIEW / MEMBER</p>
          <h1 id="account-heading">WELCOME, {firstName.toUpperCase()}.</h1>
          <div className="account-grid">
            <section className="account-card" id="settings"><h2>PROFILE DETAILS</h2><dl><dt>Full name</dt><dd>{me.full_name ?? "—"}</dd><dt>Email</dt><dd>{me.email}</dd><dt>Phone</dt><dd>{me.phone ?? "Not provided"}</dd></dl><div className="account-card__actions"><Link to="/account">Edit profile</Link><Link to="/account">Change password</Link></div></section>
            <section className="account-card" id="saved"><h2>SAVED ITEMS</h2><p className="account-stat">0<span>Frames waiting in your edit.</span></p><div className="account-card__actions"><Link to="/products">Explore collection</Link></div></section>
            <section className="account-card account-card--wide" id="orders"><h2>RECENT ORDERS</h2><div className="account-order"><code>NO ORDERS YET</code><strong>—</strong><span>Your recent purchases will appear here.</span></div><div className="account-card__actions"><Link to="/products">Shop eyewear</Link></div></section>
            <section className="account-card account-card--wide" id="address"><h2>DEFAULT SHIPPING ADDRESS</h2><p className="account-stat">—<span>No shipping address saved yet.</span></p><div className="account-card__actions"><Link to="/account">Add address</Link></div></section>
          </div>
        </div>
      </div>
    </section>
  );
}
