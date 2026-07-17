import { Link } from "react-router";
import type { Route } from "./+types/products";
import { loadProductList } from "~/features/catalog/services/product.service";
import { publicServerApi } from "~/lib/http.server";
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
  const products = await loadProductList(publicServerApi, url, request.signal);
  return { products };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData;

  return (
    <section aria-labelledby="products-heading">
      <h1 id="products-heading">Sản phẩm</h1>
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
    </section>
  );
}
