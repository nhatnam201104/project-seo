import type { AdminResourceRecord } from "~/features/admin-shared/lib/admin-resource.types";

export const ADMIN_ORDERS_MOCK: ReadonlyArray<AdminResourceRecord> = [
  { id: "o-01", title: "OD-20260809-A14F", subtitle: "Nguyễn Minh Anh · 0909 121 232", status: "PENDING", attributes: { total: 2250000, payment: "Chuyển khoản · Chờ xác nhận", tracking: "—" }, updatedAt: "2026-08-09T08:42:00Z" },
  { id: "o-02", title: "OD-20260809-B20C", subtitle: "Trần Hải Yến · 0938 818 446", status: "CONFIRMED", attributes: { total: 1680000, payment: "VNPAY · Đã thanh toán", tracking: "—" }, updatedAt: "2026-08-09T08:05:00Z" },
  { id: "o-03", title: "OD-20260808-C11A", subtitle: "Lê Quốc Bảo · 0914 225 680", status: "SHIPPING", attributes: { total: 3100000, payment: "COD · Chờ thu", tracking: "GHN8K22156" }, updatedAt: "2026-08-08T16:15:00Z" },
  { id: "o-04", title: "OD-20260808-D91M", subtitle: "Phạm Gia Hân · 0982 331 570", status: "COMPLETED", attributes: { total: 1420000, payment: "COD · Đã thanh toán", tracking: "GHTK338901" }, updatedAt: "2026-08-08T12:00:00Z" },
  { id: "o-05", title: "OD-20260807-E03P", subtitle: "Võ Thành Nam · 0903 444 201", status: "CANCELLED", attributes: { total: 890000, payment: "COD · Đã hủy", tracking: "—" }, updatedAt: "2026-08-07T15:35:00Z" },
  { id: "o-06", title: "OD-20260807-F77K", subtitle: "Đỗ Khánh Linh · 0977 100 628", status: "COMPLETED", attributes: { total: 2750000, payment: "VNPAY · Đã thanh toán", tracking: "VNPOST44122" }, updatedAt: "2026-08-07T10:10:00Z" },
  { id: "o-07", title: "OD-20260806-G55Q", subtitle: "Bùi Thu Trang · 0908 703 155", status: "REFUNDED", attributes: { total: 1990000, payment: "VNPAY · Hoàn tiền", tracking: "GHN7H99102" }, updatedAt: "2026-08-06T09:20:00Z" },
];
