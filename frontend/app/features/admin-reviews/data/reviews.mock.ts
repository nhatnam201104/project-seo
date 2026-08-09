import type { AdminResourceRecord } from "~/features/admin-shared/lib/admin-resource.types";

export const ADMIN_REVIEWS_MOCK: ReadonlyArray<AdminResourceRecord> = [
  { id: "rv-01", title: "Gọng rất nhẹ, đeo cả ngày không đau", subtitle: "Nguyễn Khánh Linh · 5 sao", status: "PENDING", attributes: { product: "MORAINE Core 01", rating: "★★★★★", date: "09/08/2026" }, updatedAt: "2026-08-09T08:32:00Z" },
  { id: "rv-02", title: "Màu thực tế đẹp hơn ảnh", subtitle: "Trần Gia Bảo · 5 sao", status: "PENDING", attributes: { product: "VISOR Titanium V2", rating: "★★★★★", date: "09/08/2026" }, updatedAt: "2026-08-09T07:05:00Z" },
  { id: "rv-03", title: "Đóng gói kỹ, giao đúng hẹn", subtitle: "Lê Thu Hà · 4 sao", status: "PUBLISHED", attributes: { product: "MORAINE Air 03", rating: "★★★★☆", date: "08/08/2026" }, updatedAt: "2026-08-08T12:00:00Z" },
  { id: "rv-04", title: "Nội dung chứa thông tin liên hệ", subtitle: "Tài khoản ẩn · 2 sao", status: "HIDDEN", attributes: { product: "ATLAS Sun 07", rating: "★★☆☆☆", date: "07/08/2026" }, updatedAt: "2026-08-07T13:30:00Z" },
  { id: "rv-05", title: "Tư vấn size rất chuẩn", subtitle: "Võ Minh Khoa · 5 sao", status: "PUBLISHED", attributes: { product: "MORAINE Studio 02", rating: "★★★★★", date: "06/08/2026" }, updatedAt: "2026-08-06T11:15:00Z" },
  { id: "rv-06", title: "Cần kiểm tra lại nội dung", subtitle: "Phạm Lan Anh · 3 sao", status: "PENDING", attributes: { product: "LUMEN Kids K4", rating: "★★★☆☆", date: "05/08/2026" }, updatedAt: "2026-08-05T09:45:00Z" },
  { id: "rv-07", title: "Kính râm chống chói tốt", subtitle: "Đỗ Trung Hiếu · 4 sao", status: "PUBLISHED", attributes: { product: "ATLAS Sun 07", rating: "★★★★☆", date: "04/08/2026" }, updatedAt: "2026-08-04T08:30:00Z" },
];
