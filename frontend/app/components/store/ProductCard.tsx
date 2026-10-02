import { Link } from "react-router";
import type { ProductSummary } from "~/features/catalog/api/product.types";
import { formatVnd } from "~/lib/format";

export function GlassesGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="24" cy="21" r="16" /><circle cx="72" cy="21" r="16" /><path d="M40 19c5-4 11-4 16 0M8 17 1 11M88 17l7-6" />
    </svg>
  );
}

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="sp-card">
      <Link to={`/product/${product.slug}`} aria-label={product.name}>
        <div className="sp-card__thumb">
          {product.thumbnail_url ? <img src={product.thumbnail_url} alt="" loading="lazy" /> : <GlassesGlyph />}
        </div>
        <h3>{product.name}</h3>
        <p className="sp-card__price"><span>Từ</span> {formatVnd(product.min_price)}</p>
        <p className="sp-card__rating">★ {product.rating_avg} ({product.review_count})</p>
      </Link>
    </article>
  );
}
