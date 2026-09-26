import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition } from "~/features/admin-shared/lib/admin-resource.types";
import { ADMIN_CATALOG_MOCK } from "../data/catalog.mock";

const service = createMockAdminResourceService(ADMIN_CATALOG_MOCK);
const definition: AdminResourceDefinition = {
  eyebrow: "Taxonomy / Merchandising",
  title: "Danh mục & thương hiệu",
  entityLabel: "Mục catalog",
  countLabel: "nhóm phân loại",
  description:
    "Quản lý cây danh mục và thương hiệu trong cùng một nhịp làm việc, bao gồm slug và trạng thái hiển thị.",
  searchPlaceholder: "Tìm danh mục, thương hiệu hoặc slug…",
  createLabel: "Thêm mục catalog",
  columns: [
    { key: "type", label: "Loại" },
    { key: "slug", label: "Slug" },
    { key: "items", label: "Sản phẩm", format: (value) => `${value} mục` },
  ],
  formFields: [
    { key: "type", label: "Loại", placeholder: "Danh mục / Thương hiệu" },
    { key: "slug", label: "Slug", placeholder: "slug" },
    { key: "items", label: "Số sản phẩm", placeholder: "0", type: "number" },
  ],
  statuses: [
    { value: "ACTIVE", label: "Đang hiển thị", tone: "positive" },
    { value: "INACTIVE", label: "Đã ẩn", tone: "neutral" },
  ],
};

export function CatalogManagement() {
  return <AdminResourceWorkspace definition={definition} service={service} />;
}
