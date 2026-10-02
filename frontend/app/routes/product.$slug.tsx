import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/product.$slug";
import * as productApi from "~/features/catalog/api/product.api";
import { colorCss } from "~/features/catalog/catalog-filters";
import { createPublicServerApi } from "~/lib/http.server";
import { isApiError } from "~/core/api";
import { formatVnd } from "~/lib/format";
import { GlassesGlyph, ProductCard } from "~/components/store/ProductCard";

export function meta({ data }: Route.MetaArgs) {
  const p = data?.product;
  if (!p) return [{ title: "Không tìm thấy sản phẩm — ProjectSale" }];
  return [
    { title: p.meta_title || `${p.name} — ProjectSale` },
    { name: "description", content: p.meta_description || p.description?.slice(0, 160) || "Mắt kính chính hãng tại ProjectSale." },
  ];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const client = createPublicServerApi(request, context);
  try {
    const [product, related] = await Promise.all([
      productApi.getProductBySlug(client, params.slug, request.signal),
      productApi.getRelatedProducts(client, params.slug, request.signal).catch(() => []),
    ]);
    return { product, related: related.slice(0, 4) };
  } catch (error) {
    if (isApiError(error) && error.status === 404) throw new Response("Không tìm thấy sản phẩm", { status: 404 });
    throw error;
  }
}

const uniq = <T,>(values: (T | null | undefined)[]) => [...new Set(values.filter((v): v is T => v != null && v !== ""))];
const GENDER_LABEL: Record<string, string> = { nam: "Nam", nu: "Nữ", unisex: "Unisex" };

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const { product, related } = loaderData;
  const images = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
  const colors = useMemo(() => uniq(product.variants.map((v) => v.color)), [product.variants]);
  const sizes = useMemo(() => uniq(product.variants.map((v) => v.size)), [product.variants]);
  const lenses = useMemo(() => uniq(product.variants.map((v) => v.lens_option)), [product.variants]);

  const [imageIndex, setImageIndex] = useState(0);
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");
  const [lens, setLens] = useState("");
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState("");

  const variant = product.variants.find((v) => (!color || v.color === color) && (!size || v.size === size) && (!lens || v.lens_option === lens))
    ?? product.variants.find((v) => (!color || v.color === color) && (!size || v.size === size))
    ?? product.variants[0];
  const price = variant?.price ?? product.min_price;
  const stock = variant?.stock_qty ?? 0;
  const outOfStock = Boolean(variant) && stock <= 0;
  const image = images[imageIndex];
  const comingSoon = () => setNotice("Giỏ hàng và danh sách yêu thích đang được phát triển.");

  return (
    <section className="sp-page" aria-labelledby="product-name">
      <div className="sp-page__inner">
        <nav className="sp-crumb" aria-label="Breadcrumb">
          <Link to="/products">Sản phẩm</Link><span aria-hidden="true">/</span>
          <Link to={`/products?category=${encodeURIComponent(product.category.slug)}`}>{product.category.name}</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="sp-pd">
          <div className="sp-gallery">
            <div className="sp-gallery__main">{image ? <img src={image.url} alt={image.alt ?? product.name} /> : <GlassesGlyph />}</div>
            {images.length > 1 ? (
              <div className="sp-gallery__thumbs">
                {images.slice(0, 4).map((img, i) => (
                  <button key={img.url + i} type="button" aria-label={`Ảnh ${i + 1}`} aria-pressed={i === imageIndex} onClick={() => setImageIndex(i)}><img src={img.url} alt="" /></button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="sp-info">
            <div><p className="sp-info__brand">{product.brand.name}</p><h1 id="product-name">{product.name}</h1></div>
            <p className="sp-info__rating">★ {product.rating_avg} · <a href="#reviews">{product.review_count} đánh giá</a></p>
            <p className="sp-price">{formatVnd(price)}</p>
            {product.description ? <p className="sp-info__desc">{product.description}</p> : null}

            {colors.length ? (
              <fieldset className="sp-opt"><legend>Màu sắc <b>{color}</b></legend>
                <div className="sp-swatches sp-swatches--lg">
                  {colors.map((c) => (
                    <label key={c} className="sp-swatch" title={c}>
                      <input type="radio" name="color" value={c} checked={c === color} onChange={() => setColor(c)} aria-label={c} />
                      <span style={{ background: colorCss(c) }} />
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {sizes.length ? (
              <fieldset className="sp-opt"><legend>Kích cỡ</legend>
                <div className="sp-sizes">
                  {sizes.map((s) => <label key={s} className="sp-size"><input type="radio" name="size" value={s} checked={s === size} onChange={() => setSize(s)} /><span>{s}</span></label>)}
                </div>
              </fieldset>
            ) : null}

            {product.has_lens && lenses.length ? (
              <div className="sp-opt">
                <div className="sp-field">
                  <label htmlFor="lens">Tròng kính</label>
                  <div className="sp-field__control sp-field__control--select">
                    <select id="lens" value={lens} onChange={(e) => setLens(e.target.value)}>
                      <option value="">Chỉ mua gọng</option>
                      {lenses.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {variant ? <p className="sp-info__stock">{outOfStock ? "Hết hàng" : `Còn ${stock} sản phẩm`} · SKU {variant.sku}</p> : null}

            <div className="sp-buy">
              <div className="sp-qty" role="group" aria-label="Số lượng">
                <button type="button" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <output aria-live="polite">{qty}</output>
                <button type="button" aria-label="Tăng" onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1))}>+</button>
              </div>
              <button type="button" className="sp-btn" disabled={outOfStock} onClick={comingSoon}>{outOfStock ? "Hết hàng" : "Thêm vào giỏ"}</button>
            </div>
            <button type="button" className="sp-btn sp-btn--ghost sp-btn--full" onClick={comingSoon}>Lưu sản phẩm</button>
            {notice ? <p className="sp-alert" role="status">{notice}</p> : null}

            <dl className="sp-facts">
              {product.warranty_months ? <div><dt>Bảo hành</dt><dd>{product.warranty_months} tháng chính hãng</dd></div> : null}
              <div><dt>Thanh toán</dt><dd>COD hoặc VNPAY</dd></div>
              <div><dt>Đổi trả</dt><dd><Link to="/policies/doi-tra">Xem chính sách</Link></dd></div>
            </dl>
          </div>
        </div>

        <div className="sp-two" id="reviews">
          <div>
            <h2>Thông số</h2>
            <dl className="sp-spec">
              <div><dt>Thương hiệu</dt><dd>{product.brand.name}</dd></div>
              <div><dt>Danh mục</dt><dd>{product.category.name}</dd></div>
              {uniq(product.variants.map((v) => v.material)).length ? <div><dt>Chất liệu</dt><dd>{uniq(product.variants.map((v) => v.material)).join(", ")}</dd></div> : null}
              {product.gender ? <div><dt>Giới tính</dt><dd>{GENDER_LABEL[product.gender.toLowerCase()] ?? product.gender}</dd></div> : null}
              {product.face_tags?.length ? <div><dt>Dáng mặt</dt><dd>{product.face_tags.join(", ")}</dd></div> : null}
              <div><dt>Tròng kính</dt><dd>{product.has_lens ? "Có thể lắp" : "Chỉ gọng"}</dd></div>
            </dl>
          </div>
          <div>
            <h2>Đánh giá</h2>
            <div className="sp-score"><b>{product.rating_avg}</b><span>★ · {product.review_count} đánh giá</span></div>
            <p className="sp-reviews__empty">Nội dung đánh giá chi tiết sẽ hiển thị tại đây khi máy chủ cung cấp dữ liệu.</p>
          </div>
        </div>

        {related.length ? (
          <div className="sp-related">
            <h2>Có thể bạn cũng thích</h2>
            <div className="sp-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        ) : null}

        <div className="sp-sticky" aria-hidden={false}>
          <div><strong>{formatVnd(price)}</strong><small>{[color, size].filter(Boolean).join(" · ")}</small></div>
          <button type="button" className="sp-btn" disabled={outOfStock} onClick={comingSoon}>Thêm vào giỏ</button>
        </div>
        <div style={{ height: 64 }} />
      </div>
    </section>
  );
}
