import { formatVnd } from "~/lib/format";
import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition } from "~/features/admin-shared/lib/admin-resource.types";
import { ADMIN_ORDERS_MOCK } from "../data/orders.mock";

const service = createMockAdminResourceService(ADMIN_ORDERS_MOCK);
const ORDER_TRANSITIONS: Readonly<Record<string, ReadonlyArray<string>>> = {
  PENDING: ["PENDING", "CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CONFIRMED", "SHIPPING", "CANCELLED"],
  SHIPPING: ["SHIPPING", "COMPLETED"],
  COMPLETED: ["COMPLETED", "REFUNDED"],
  CANCELLED: ["CANCELLED"],
  REFUNDED: ["REFUNDED"],
};
const definition: AdminResourceDefinition = {
  eyebrow: "Fulfilment / Payments",
  title: "Đơn hàng",
  entityLabel: "Đơn hàng",
  countLabel: "đơn trong hàng đợi",
  description:
    "Theo dõi thanh toán, giao vận và chuyển trạng thái đơn theo đúng ma trận vận hành trong PRD.",
  searchPlaceholder: "Tìm mã đơn, tên hoặc số điện thoại…",
  columns: [
    { key: "total", label: "Tổng tiền", format: (value) => formatVnd(value) },
    { key: "payment", label: "Thanh toán" },
    { key: "tracking", label: "Mã vận đơn" },
  ],
  formFields: [
    { key: "total", label: "Tổng tiền", placeholder: "0", type: "number" },
    { key: "payment", label: "Thanh toán", placeholder: "COD · Chờ thu" },
    { key: "tracking", label: "Mã vận đơn", placeholder: "GHN…" },
  ],
  statuses: [
    { value: "PENDING", label: "Chờ xác nhận", tone: "warning" },
    { value: "CONFIRMED", label: "Đã xác nhận", tone: "review" },
    { value: "SHIPPING", label: "Đang giao", tone: "review" },
    { value: "COMPLETED", label: "Hoàn tất", tone: "positive" },
    { value: "CANCELLED", label: "Đã hủy", tone: "critical" },
    { value: "REFUNDED", label: "Hoàn tiền", tone: "neutral" },
  ],
  allowedStatusValues: (record) =>
    ORDER_TRANSITIONS[record.status] ?? [record.status],
};

export function OrderManagement() {
  return <AdminResourceWorkspace definition={definition} service={service} />;
}
