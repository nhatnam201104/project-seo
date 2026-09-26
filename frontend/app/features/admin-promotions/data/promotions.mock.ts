import type { AdminResourceRecord } from "~/features/admin-shared/lib/admin-resource.types";

export const ADMIN_PROMOTIONS_MOCK: ReadonlyArray<AdminResourceRecord> = [
  { id: "pr-01", title: "SALE10", subtitle: "Giảm 10% đơn từ 500.000đ", status: "ACTIVE", attributes: { value: "10%", usage: "142 / 500", end: "31/08/2026" }, updatedAt: "2026-08-09T08:00:00Z" },
  { id: "pr-02", title: "NEW150", subtitle: "Khách mới giảm 150.000đ", status: "ACTIVE", attributes: { value: "150.000đ", usage: "86 / 300", end: "15/09/2026" }, updatedAt: "2026-08-08T09:00:00Z" },
  { id: "pr-03", title: "FREESHIP", subtitle: "Hỗ trợ phí giao hàng", status: "SCHEDULED", attributes: { value: "30.000đ", usage: "0 / 200", end: "30/09/2026" }, updatedAt: "2026-08-07T10:00:00Z" },
  { id: "pr-04", title: "TITAN20", subtitle: "Giảm gọng titan chọn lọc", status: "ACTIVE", attributes: { value: "20%", usage: "64 / 100", end: "20/08/2026" }, updatedAt: "2026-08-06T11:00:00Z" },
  { id: "pr-05", title: "JULY100", subtitle: "Chiến dịch tháng 7", status: "EXPIRED", attributes: { value: "100.000đ", usage: "198 / 200", end: "31/07/2026" }, updatedAt: "2026-08-01T08:00:00Z" },
  { id: "pr-06", title: "VIP15", subtitle: "Ưu đãi khách thân thiết", status: "INACTIVE", attributes: { value: "15%", usage: "42 / 100", end: "31/12/2026" }, updatedAt: "2026-07-30T08:00:00Z" },
  { id: "pr-07", title: "FLASH08", subtitle: "Flash sale 8.8", status: "EXPIRED", attributes: { value: "8%", usage: "500 / 500", end: "08/08/2026" }, updatedAt: "2026-08-09T00:05:00Z" },
];
