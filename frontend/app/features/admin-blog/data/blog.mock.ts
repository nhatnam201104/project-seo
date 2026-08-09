import type { AdminResourceRecord } from "~/features/admin-shared/lib/admin-resource.types";

export const ADMIN_BLOG_MOCK: ReadonlyArray<AdminResourceRecord> = [
  { id: "bp-01", title: "Chọn gọng kính theo khuôn mặt", subtitle: "Hướng dẫn mua kính · 8 phút đọc", status: "PUBLISHED", attributes: { author: "Minh Anh", slug: "chon-gong-kinh-theo-khuon-mat", publish: "08/08/2026" }, updatedAt: "2026-08-08T07:00:00Z" },
  { id: "bp-02", title: "Titan có thực sự nhẹ hơn?", subtitle: "Vật liệu · 6 phút đọc", status: "DRAFT", attributes: { author: "Hải Yến", slug: "gong-titan-co-nhe-hon", publish: "Chưa xuất bản" }, updatedAt: "2026-08-09T08:10:00Z" },
  { id: "bp-03", title: "Cách đọc thông số độ cận", subtitle: "Kiến thức thị lực · 10 phút đọc", status: "PUBLISHED", attributes: { author: "Bảo Ngọc", slug: "cach-doc-thong-so-do-can", publish: "05/08/2026" }, updatedAt: "2026-08-05T06:00:00Z" },
  { id: "bp-04", title: "Giữ kính trong suốt mùa mưa", subtitle: "Bảo quản · 5 phút đọc", status: "DRAFT", attributes: { author: "Minh Anh", slug: "giu-kinh-trong-suot-mua-mua", publish: "Chưa xuất bản" }, updatedAt: "2026-08-04T15:00:00Z" },
  { id: "bp-05", title: "5 dấu hiệu cần thay gọng", subtitle: "Tư vấn · 7 phút đọc", status: "PUBLISHED", attributes: { author: "Hải Yến", slug: "dau-hieu-can-thay-gong", publish: "01/08/2026" }, updatedAt: "2026-08-01T07:00:00Z" },
  { id: "bp-06", title: "Kính phân cực và kính chống UV", subtitle: "Kính râm · 9 phút đọc", status: "PUBLISHED", attributes: { author: "Bảo Ngọc", slug: "kinh-phan-cuc-chong-uv", publish: "28/07/2026" }, updatedAt: "2026-07-28T07:00:00Z" },
  { id: "bp-07", title: "Behind the frame: MORAINE", subtitle: "Câu chuyện sản phẩm · 4 phút đọc", status: "DRAFT", attributes: { author: "Minh Anh", slug: "behind-the-frame-moraine", publish: "Chưa xuất bản" }, updatedAt: "2026-07-27T12:00:00Z" },
];
