import { formatVnd } from "~/lib/format";
import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition } from "~/features/admin-shared/lib/admin-resource.types";
import { ADMIN_PRODUCTS_MOCK } from "../data/products.mock";

const service = createMockAdminResourceService(ADMIN_PRODUCTS_MOCK);
const definition: AdminResourceDefinition = {
  eyebrow: "Catalog / Inventory",
  title: "Sản phẩm & kho",
  entityLabel: "Sản phẩm",
  countLabel: "sản phẩm đang theo dõi",
  description:
    "Điều phối sản phẩm, SKU, giá và tồn kho trong một workspace. Các SKU sắp hết hàng được ưu tiên để đội vận hành xử lý sớm.",
  searchPlaceholder: "Tìm tên, SKU, thương hiệu…",
  createLabel: "Thêm sản phẩm",
  columns: [
    { key: "sku", label: "SKU" },
    { key: "stock", label: "Tồn kho", format: (value) => `${value} chiếc` },
    { key: "price", label: "Giá bán", format: (value) => formatVnd(value) },
  ],
  formFields: [
    { key: "slug", label: "Slug", placeholder: "moraine-core-01" },
    { key: "sku", label: "SKU đại diện", placeholder: "MOR-C01-BLK" },
    { key: "stock", label: "Tồn kho", placeholder: "0", type: "number" },
    { key: "price", label: "Giá bán", placeholder: "1400000", type: "number" },
  ],
  statuses: [
    { value: "ACTIVE", label: "Đang bán", tone: "positive" },
    { value: "INACTIVE", label: "Ngừng bán", tone: "neutral" },
  ],
};

export function ProductManagement() {
  return <AdminResourceWorkspace definition={definition} service={service} />;
}
