import type { AdminResourceRecord } from "~/features/admin-shared/lib/admin-resource.types";

export const ADMIN_USERS_MOCK: ReadonlyArray<AdminResourceRecord> = [
  { id: "5d961c2e-7e42-4b7d-931f-045b75618610", title: "Nguyễn Minh Anh", subtitle: "minhanh@example.com", status: "ACTIVE", attributes: { role: "USER", phone: "0909 121 232", created: "09/07/2026" }, updatedAt: "2026-08-09T08:20:00Z" },
  { id: "5d961c2e-7e42-4b7d-931f-045b75618611", title: "Trần Hải Yến", subtitle: "haiyen@example.com", status: "ACTIVE", attributes: { role: "USER", phone: "0938 818 446", created: "12/07/2026" }, updatedAt: "2026-08-08T08:20:00Z" },
  { id: "5d961c2e-7e42-4b7d-931f-045b75618612", title: "Quản trị ProjectSale", subtitle: "admin@projectsale.vn", status: "ACTIVE", attributes: { role: "ADMIN", phone: "0901 100 100", created: "01/07/2026" }, updatedAt: "2026-08-07T08:20:00Z" },
  { id: "5d961c2e-7e42-4b7d-931f-045b75618613", title: "Lê Quốc Bảo", subtitle: "quocbao@example.com", status: "ACTIVE", attributes: { role: "USER", phone: "0914 225 680", created: "18/07/2026" }, updatedAt: "2026-08-06T08:20:00Z" },
  { id: "5d961c2e-7e42-4b7d-931f-045b75618614", title: "Phạm Gia Hân", subtitle: "giahan@example.com", status: "INACTIVE", attributes: { role: "USER", phone: "0982 331 570", created: "21/07/2026" }, updatedAt: "2026-08-05T08:20:00Z" },
  { id: "5d961c2e-7e42-4b7d-931f-045b75618615", title: "Võ Thành Nam", subtitle: "thanhnam@example.com", status: "ACTIVE", attributes: { role: "USER", phone: "0903 444 201", created: "27/07/2026" }, updatedAt: "2026-08-04T08:20:00Z" },
  { id: "5d961c2e-7e42-4b7d-931f-045b75618616", title: "Đỗ Khánh Linh", subtitle: "khanhlinh@example.com", status: "ACTIVE", attributes: { role: "USER", phone: "0977 100 628", created: "02/08/2026" }, updatedAt: "2026-08-03T08:20:00Z" },
];
