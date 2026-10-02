import type { AxiosInstance, ApiEnvelope } from "~/core/api";
import { unwrapData } from "~/core/api";
import type { BrandOption, CategoryOption } from "./product.types";

/** Danh mục / thương hiệu (public read) — dùng cho bộ lọc trang sản phẩm. */
export const CATALOG_ENDPOINTS = {
  categories: "/categories",
  brands: "/brands",
} as const;

export async function getCategories(client: AxiosInstance, signal?: AbortSignal): Promise<CategoryOption[]> {
  const res = await client.get<ApiEnvelope<CategoryOption[]>>(CATALOG_ENDPOINTS.categories, { signal });
  return unwrapData(res.data) ?? [];
}

export async function getBrands(client: AxiosInstance, signal?: AbortSignal): Promise<BrandOption[]> {
  const res = await client.get<ApiEnvelope<BrandOption[]>>(CATALOG_ENDPOINTS.brands, { signal });
  return unwrapData(res.data) ?? [];
}
