import { Form, Link } from "react-router";
import type { Route } from "./+types/home";
import { loadProductList } from "~/features/catalog/services/product.service";
import { publicServerApi } from "~/lib/http.server";
import { getAuth } from "~/lib/auth.server";
import { formatVnd } from "~/lib/format";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "ProjectSale — Mắt kính chính hãng, giá minh bạch" },
    {
      name: "description",
      content:
        "Mua gọng kính, kính cận, kính râm chính hãng. Giao COD/VNPAY toàn quốc.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  // Đọc song song: danh sách sản phẩm (public) + user (nếu đăng nhập).
  const [products, auth] = await Promise.all([
    loadProductList(publicServerApi, url, request.signal),
    getAuth(request),
  ]);
  return { products, user: auth.user };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { products, user } = loaderData;

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>ProjectSale</h1>
        <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            <>
              <Link to="/account">{user.full_name ?? user.email}</Link>
              {user.role === "ADMIN" ? <Link to="/admin">Quản trị</Link> : null}
              <Form method="post" action="/logout">
                <button type="submit">Đăng xuất</button>
              </Form>
            </>
          ) : (
            <Link to="/login">Đăng nhập</Link>
          )}
        </nav>
      </header>

      <p style={{ color: "var(--color-muted)" }}>
        {products.totalElements} sản phẩm · trang {products.number + 1}/
        {Math.max(products.totalPages, 1)}
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {products.content.map((p) => (
          <article
            key={p.id}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: 12,
            }}
          >
            <Link to={`/product/${p.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: "var(--color-accent)", marginTop: 6 }}>
                {formatVnd(p.min_price)}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                ★ {p.rating_avg} ({p.review_count})
              </div>
            </Link>
          </article>
        ))}
        {products.content.length === 0 ? <p>Chưa có sản phẩm.</p> : null}
      </section>
    </main>
  );
}
