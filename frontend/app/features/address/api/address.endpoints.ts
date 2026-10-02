/**
 * Contract đề xuất cho backend (sau base /api/v1) — CHƯA có controller tương ứng
 * (entity Address đã có). Mọi endpoint yêu cầu Bearer token.
 */
export const ADDRESS_ENDPOINTS = {
  collection: "/users/me/addresses", // GET danh sách, POST tạo
  item: (id: string) => `/users/me/addresses/${id}`, // GET, PUT, DELETE
  makeDefault: (id: string) => `/users/me/addresses/${id}/default`, // POST
} as const;
