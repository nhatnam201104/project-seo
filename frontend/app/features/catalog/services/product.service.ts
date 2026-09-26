import type { AxiosInstance, Page } from "~/core/api";
import * as productApi from "../api/product.api";
import type { GetProductsParams, ProductSummary } from "../api/product.types";

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 12;

function numberParam(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function stringParam(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

/**
 * URL-AS-STATE: bộ lọc / sort / phân trang lấy TỪ URL (search params), không
 * nhét vào Zustand — hỗ trợ back/forward, share link, SEO.
 */
export function parseProductQuery(url: URL): GetProductsParams {
  const sp = url.searchParams;
  const params: GetProductsParams = {
    page: numberParam(sp.get("page")) ?? DEFAULT_PAGE,
    size: numberParam(sp.get("size")) ?? DEFAULT_SIZE,
  };

  const sort = sp.get("sort");
  if (sort) params.sort = sort;

  const categoryId = stringParam(sp.get("categoryId"));
  if (categoryId != null) params.categoryId = categoryId;

  const brandId = stringParam(sp.get("brandId"));
  if (brandId != null) params.brandId = brandId;

  const minPrice = numberParam(sp.get("minPrice"));
  if (minPrice != null) params.minPrice = minPrice;

  const maxPrice = numberParam(sp.get("maxPrice"));
  if (maxPrice != null) params.maxPrice = maxPrice;

  const color = sp.get("color");
  if (color) params.color = color;

  const gender = stringParam(sp.get("gender"));
  if (gender) params.gender = gender;

  const hasLens = sp.get("hasLens");
  if (hasLens === "true" || hasLens === "false") params.hasLens = hasLens === "true";

  const faceTag = stringParam(sp.get("faceTag"));
  if (faceTag) params.faceTag = faceTag.toLowerCase();

  return params;
}

/** Loader gọi hàm này: parse URL → gọi API → trả Page<ProductSummary>. */
export async function loadProductList(
  client: AxiosInstance,
  url: URL,
  signal?: AbortSignal,
): Promise<Page<ProductSummary>> {
  return productApi.getProducts(client, parseProductQuery(url), signal);
}
