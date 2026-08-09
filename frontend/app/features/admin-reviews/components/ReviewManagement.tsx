import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition } from "~/features/admin-shared/lib/admin-resource.types";
import { ADMIN_REVIEWS_MOCK } from "../data/reviews.mock";

const service = createMockAdminResourceService(ADMIN_REVIEWS_MOCK);
const definition: AdminResourceDefinition = {
  eyebrow: "Trust / Moderation",
  title: "Kiểm duyệt đánh giá",
  entityLabel: "Đánh giá",
  countLabel: "đánh giá trong hệ thống",
  description:
    "Duyệt hoặc ẩn phản hồi của khách trước khi cập nhật điểm trung bình trên trang sản phẩm.",
  searchPlaceholder: "Tìm nội dung, khách hàng hoặc sản phẩm…",
  columns: [
    { key: "product", label: "Sản phẩm" },
    { key: "rating", label: "Điểm" },
    { key: "date", label: "Ngày gửi" },
  ],
  formFields: [
    { key: "product", label: "Sản phẩm", placeholder: "Tên sản phẩm" },
    { key: "rating", label: "Điểm", placeholder: "★★★★★" },
    { key: "date", label: "Ngày gửi", placeholder: "09/08/2026" },
  ],
  statuses: [
    { value: "PENDING", label: "Chờ duyệt", tone: "warning" },
    { value: "PUBLISHED", label: "Đã đăng", tone: "positive" },
    { value: "HIDDEN", label: "Đã ẩn", tone: "critical" },
  ],
};

export function ReviewManagement() {
  return <AdminResourceWorkspace definition={definition} service={service} />;
}
