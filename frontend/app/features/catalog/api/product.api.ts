import type { AxiosInstance, ApiEnvelope, Page } from "~/core/api";
import { unwrapData, unwrapPage } from "~/core/api";
import { PRODUCT_ENDPOINTS } from "./product.endpoints";
import type {
  GetProductsParams,
  ProductDetail,
  ProductSummary,
  SearchProductsParams,
} from "./product.types";

/**
 * API module cho Products (public read). Nhận `client: AxiosInstance` qua DI.
 * Ở loader SSR, truyền `publicServerApi` từ lib/http.server.
 *
 * Backend bọc mọi response trong envelope { error, data, pagination } → bóc tách
 * bằng unwrapData / unwrapPage trước khi trả cho tầng service.
 */

export async function getProducts(
  client: AxiosInstance,
  params: GetProductsParams,
  signal?: AbortSignal,
): Promise<Page<ProductSummary>> {
  const res = await client.get<ApiEnvelope<ProductSummary[]>>(PRODUCT_ENDPOINTS.list, {
    params,
    signal,
  });
  return unwrapPage(res.data);
}

export async function searchProducts(
  client: AxiosInstance,
  params: SearchProductsParams,
  signal?: AbortSignal,
): Promise<Page<ProductSummary>> {
  const res = await client.get<ApiEnvelope<ProductSummary[]>>(PRODUCT_ENDPOINTS.search, {
    params,
    signal,
  });
  return unwrapPage(res.data);
}

export async function getProductBySlug(
  client: AxiosInstance,
  slug: string,
  signal?: AbortSignal,
): Promise<ProductDetail> {
  const res = await client.get<ApiEnvelope<ProductDetail>>(PRODUCT_ENDPOINTS.detail(slug), {
    signal,
  });
  return unwrapData(res.data);
}

export async function getRelatedProducts(
  client: AxiosInstance,
  slug: string,
  signal?: AbortSignal,
): Promise<ProductSummary[]> {
  const res = await client.get<ApiEnvelope<ProductSummary[]>>(
    PRODUCT_ENDPOINTS.related(slug),
    { signal },
  );
  return unwrapData(res.data);
}
