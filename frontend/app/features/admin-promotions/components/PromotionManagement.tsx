import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition } from "~/features/admin-shared/lib/admin-resource.types";
import { ADMIN_PROMOTIONS_MOCK } from "../data/promotions.mock";

const service = createMockAdminResourceService(ADMIN_PROMOTIONS_MOCK);
const definition: AdminResourceDefinition = {
  eyebrow: "Campaigns / Conversion",
  title: "Khuyến mãi",
  entityLabel: "Mã khuyến mãi",
  countLabel: "chiến dịch đã cấu hình",
  description:
    "Theo dõi hiệu lực, giá trị và giới hạn sử dụng của từng mã trước khi công bố tới khách hàng.",
  searchPlaceholder: "Tìm mã hoặc tên chiến dịch…",
  createLabel: "Tạo khuyến mãi",
  columns: [
    { key: "value", label: "Giá trị" },
    { key: "usage", label: "Đã dùng / giới hạn" },
    { key: "end", label: "Kết thúc" },
  ],
  formFields: [
    { key: "value", label: "Giá trị giảm", placeholder: "10%" },
    { key: "usage", label: "Sử dụng", placeholder: "0 / 100" },
    { key: "end", label: "Ngày kết thúc", placeholder: "31/12/2026" },
  ],
  statuses: [
    { value: "ACTIVE", label: "Đang chạy", tone: "positive" },
    { value: "SCHEDULED", label: "Sắp diễn ra", tone: "review" },
    { value: "INACTIVE", label: "Tạm dừng", tone: "warning" },
    { value: "EXPIRED", label: "Hết hạn", tone: "neutral" },
  ],
};

export function PromotionManagement() {
  return <AdminResourceWorkspace definition={definition} service={service} />;
}
