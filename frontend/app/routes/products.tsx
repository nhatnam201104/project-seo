import { useState } from "react";
import { Form, Link, useLocation, useNavigation } from "react-router";
import type { Route } from "./+types/products";
import { loadProductList, parseProductQuery } from "~/features/catalog/services/product.service";
import * as productApi from "~/features/catalog/api/product.api";
import * as catalogApi from "~/features/catalog/api/catalog.api";
import type { BrandOption, CategoryOption } from "~/features/catalog/api/product.types";
import { COLOR_OPTIONS, FACE_OPTIONS, GENDER_OPTIONS, SORT_OPTIONS, normalizeSort } from "~/features/catalog/catalog-filters";
import { createPublicServerApi } from "~/lib/http.server";
import { ProductCard } from "~/components/store/ProductCard";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "ProjectSale — Mắt kính chính hãng, giá minh bạch" },
    { name: "description", content: "Mua gọng kính, kính cận, kính râm chính hãng. Giao COD/VNPAY toàn quốc." },
  ];
}

const safe = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => promise.catch(() => fallback);

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const client = createPublicServerApi(request, context);
  const [categories, brands] = await Promise.all([
    safe<CategoryOption[]>(catalogApi.getCategories(client, request.signal), []),
    safe<BrandOption[]>(catalogApi.getBrands(client, request.signal), []),
  ]);

  // Menu header gửi ?category=<slug|tên> và ?q=<từ khóa>: quy về tham số backend hiểu được.
  const categoryParam = url.searchParams.get("category")?.trim().toLowerCase();
  if (categoryParam && !url.searchParams.get("categoryId")) {
    const match = categories.find((c) => c.slug.toLowerCase() === categoryParam || c.name.toLowerCase() === categoryParam);
    if (match) url.searchParams.set("categoryId", match.id);
  }
  url.searchParams.set("sort", normalizeSort(url.searchParams.get("sort")));

  const q = url.searchParams.get("q")?.trim();
  const query = parseProductQuery(url);
  const products = q && q.length >= 2
    ? await productApi.searchProducts(client, { q, page: query.page, size: query.size, sort: query.sort }, request.signal)
    : await loadProductList(client, url, request.signal);
  return { products, categories, brands, query, q: q ?? "" };
}

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => { if (i && p - sorted[i - 1]! > 1) out.push("…"); out.push(p); });
  return out;
}

function Radio({ name, value, label, checked, count }: { name: string; value: string; label: string; checked: boolean; count?: number }) {
  return (
    <label className="sp-check">
      <input type="radio" name={name} value={value} defaultChecked={checked} />
      {label}{count != null ? <small>{count}</small> : null}
    </label>
  );
}

export default function Products({ loaderData }: Route.ComponentProps) {
  const { products, categories, brands, query, q } = loaderData;
  const location = useLocation();
  const navigation = useNavigation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const loading = navigation.state === "loading";
  const totalPages = Math.max(products.totalPages, 1);
  const first = products.totalElements === 0 ? 0 : products.number * products.size + 1;
  const last = products.number * products.size + products.content.length;
  const activeCount = [query.categoryId, query.brandId, query.minPrice, query.maxPrice, query.color, query.gender, query.faceTag, query.hasLens ? "1" : ""].filter((v) => v !== undefined && v !== "").length;

  const pageHref = (page: number) => {
    const sp = new URLSearchParams(location.search);
    if (page === 0) sp.delete("page"); else sp.set("page", String(page));
    const s = sp.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <section className="sp-page" aria-labelledby="products-heading">
      <div className="sp-page__inner">
        <nav className="sp-crumb" aria-label="Breadcrumb"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span>Sản phẩm</span></nav>
        <h1 id="products-heading" className="sp-title">{q ? `Kết quả cho “${q}”` : "All eyewear."}</h1>
        <p className="sp-lead">Gọng kính, kính râm và tròng kính chính hãng. Giá minh bạch, giao hàng toàn quốc.</p>

        <Form method="get" id="product-filters" aria-busy={loading}>
          {q ? <input type="hidden" name="q" value={q} /> : null}
          <div className="sp-toolbar">
            <p aria-live="polite">{products.totalElements === 0 ? "Không có sản phẩm" : `Hiển thị ${first}–${last} trong ${products.totalElements} sản phẩm`}</p>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <button type="button" className="sp-link sp-filter-toggle" aria-expanded={filtersOpen} aria-controls="filters" onClick={() => setFiltersOpen((v) => !v)}>
                Bộ lọc{activeCount ? ` (${activeCount})` : ""}
              </button>
              <label className="sp-sort">Sắp xếp
                <select name="sort" defaultValue={query.sort} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="sp-list">
            <aside id="filters" className={`sp-filters${filtersOpen ? " is-open" : ""}`} aria-label="Bộ lọc sản phẩm">
              {categories.length ? (
                <fieldset><legend>Danh mục</legend>
                  <Radio name="categoryId" value="" label="Tất cả" checked={!query.categoryId} />
                  {categories.map((c) => <Radio key={c.id} name="categoryId" value={c.id} label={c.name} checked={query.categoryId === c.id} />)}
                </fieldset>
              ) : null}
              {brands.length ? (
                <fieldset><legend>Thương hiệu</legend>
                  <Radio name="brandId" value="" label="Tất cả" checked={!query.brandId} />
                  {brands.map((b) => <Radio key={b.id} name="brandId" value={b.id} label={b.name} checked={query.brandId === b.id} />)}
                </fieldset>
              ) : null}
              <fieldset><legend>Giá (₫)</legend>
                <div className="sp-range">
                  <div className="sp-field"><label htmlFor="minPrice">Từ</label><div className="sp-field__control"><input id="minPrice" name="minPrice" type="number" min={0} step={10000} inputMode="numeric" defaultValue={query.minPrice ?? ""} placeholder="0" /></div></div>
                  <div className="sp-field"><label htmlFor="maxPrice">Đến</label><div className="sp-field__control"><input id="maxPrice" name="maxPrice" type="number" min={0} step={10000} inputMode="numeric" defaultValue={query.maxPrice ?? ""} placeholder="5000000" /></div></div>
                </div>
              </fieldset>
              <fieldset><legend>Màu sắc</legend>
                <div className="sp-swatches">
                  {COLOR_OPTIONS.map((c) => (
                    <label key={c.value} className="sp-swatch" title={c.label}>
                      <input type="radio" name="color" value={c.value} defaultChecked={query.color?.toLowerCase() === c.value} aria-label={c.label} />
                      <span style={{ background: c.css }} />
                    </label>
                  ))}
                </div>
                <Radio name="color" value="" label="Mọi màu" checked={!query.color} />
              </fieldset>
              <fieldset><legend>Giới tính</legend>
                <Radio name="gender" value="" label="Tất cả" checked={!query.gender} />
                {GENDER_OPTIONS.map((g) => <Radio key={g.value} name="gender" value={g.value} label={g.label} checked={query.gender?.toLowerCase() === g.value} />)}
              </fieldset>
              <fieldset><legend>Dáng mặt</legend>
                <Radio name="faceTag" value="" label="Tất cả" checked={!query.faceTag} />
                {FACE_OPTIONS.map((f) => <Radio key={f.value} name="faceTag" value={f.value} label={f.label} checked={query.faceTag === f.value} />)}
              </fieldset>
              <fieldset><legend>Tròng kính</legend>
                <label className="sp-check"><input type="checkbox" name="hasLens" value="true" defaultChecked={query.hasLens === true} /> Đã gắn tròng kính</label>
              </fieldset>
              <div className="sp-filters__actions">
                <button className="sp-btn" type="submit">Áp dụng</button>
                <Link className="sp-link" to="/products">Xóa bộ lọc</Link>
              </div>
            </aside>

            <div className="sp-grid">
              {products.content.map((p) => <ProductCard key={p.id} product={p} />)}
              {products.content.length === 0 ? <p className="sp-empty">Không tìm thấy sản phẩm phù hợp. Hãy thử bỏ bớt bộ lọc.</p> : null}
              {totalPages > 1 ? (
                <nav className="sp-pager" aria-label="Phân trang">
                  {products.number > 0 ? <Link to={pageHref(products.number - 1)} rel="prev">‹ Trước</Link> : null}
                  {pageList(products.number, totalPages).map((p, i) => p === "…"
                    ? <span key={`gap-${i}`} aria-hidden="true">…</span>
                    : <Link key={p} to={pageHref(p)} aria-current={p === products.number ? "page" : undefined} aria-label={`Trang ${p + 1}`}>{p + 1}</Link>)}
                  {products.number < totalPages - 1 ? <Link to={pageHref(products.number + 1)} rel="next">Sau ›</Link> : null}
                </nav>
              ) : null}
            </div>
          </div>
        </Form>
        <div style={{ height: 64 }} />
      </div>
    </section>
  );
}
