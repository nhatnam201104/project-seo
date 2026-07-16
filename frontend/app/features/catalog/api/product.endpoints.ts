/** Đường dẫn Products (sau base /api/v1). Nguồn: api-list.html §Products. */
export const PRODUCT_ENDPOINTS = {
  list: "/products",
  search: "/products/search",
  detail: (slug: string) => `/products/${slug}`,
  related: (slug: string) => `/products/${slug}/related`,
} as const;
