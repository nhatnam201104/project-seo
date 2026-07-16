import type { EntityStatus, Id } from "~/core/domain/enums";
import type { PageParams } from "~/core/api";

/**
 * Types Product/Variant/Image — bám schema.dbml + ví dụ response trong
 * api-list.html. Giá (DECIMAL(12,2)) trong ví dụ JSON là number → dùng number;
 * nếu backend serialize BigDecimal thành string, đổi sang `number | string`.
 */

export type ProductImage = {
  url: string;
  alt: string | null;
  sort_order: number;
};

export type ProductVariant = {
  variant_id: Id;
  sku: string;
  color: string | null;
  size: string | null;
  material: string | null;
  lens_option: string | null;
  price: number;
  stock_qty: number;
};

export type BrandRef = { name: string; slug: string };
export type CategoryRef = { name: string; slug: string };

/** Phần tử trong danh sách (GET /products → Page<product summary>). */
export type ProductSummary = {
  id: Id;
  name: string;
  slug: string;
  min_price: number | null;
  thumbnail_url: string | null;
  rating_avg: number;
  review_count: number;
  status?: EntityStatus;
};

/** Chi tiết (GET /products/{slug}). */
export type ProductDetail = {
  id: Id;
  name: string;
  slug: string;
  description: string | null;
  brand: BrandRef;
  category: CategoryRef;
  min_price: number | null;
  rating_avg: number;
  review_count: number;
  warranty_months: number;
  meta_title: string | null;
  meta_description: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
};

/**
 * Query params LIST (camelCase — khác body snake_case!). Nguồn: api-list.html.
 *
 * `gender`, `hasLens`, `faceTag` đã được backend PostgreSQL hỗ trợ.
 */
export type GetProductsParams = PageParams & {
  categoryId?: Id;
  brandId?: Id;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  gender?: string;
  hasLens?: boolean;
  faceTag?: string;
};

export type SearchProductsParams = PageParams & {
  q: string;
};
