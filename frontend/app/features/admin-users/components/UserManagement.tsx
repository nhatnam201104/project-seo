import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition } from "~/features/admin-shared/lib/admin-resource.types";
import { ADMIN_USERS_MOCK } from "../data/users.mock";

const service = createMockAdminResourceService(ADMIN_USERS_MOCK);
const definition: AdminResourceDefinition = {
  eyebrow: "Accounts / Access",
  title: "Người dùng",
  entityLabel: "Tài khoản",
  countLabel: "tài khoản minh họa",
  description:
    "Quan sát vai trò và trạng thái tài khoản. Prototype chỉ mô phỏng kích hoạt hoặc vô hiệu hóa, không hiển thị dữ liệu xác thực nhạy cảm.",
  extensionNote:
    "Mở rộng ngoài PRD: database có bảng users nhưng admin API và chính sách quyền chỉnh sửa tài khoản chưa được đặc tả.",
  searchPlaceholder: "Tìm tên, email hoặc số điện thoại…",
  columns: [
    { key: "role", label: "Vai trò" },
    { key: "phone", label: "Điện thoại" },
    { key: "created", label: "Ngày tham gia" },
  ],
  formFields: [
    { key: "role", label: "Vai trò", placeholder: "USER" },
    { key: "phone", label: "Điện thoại", placeholder: "0909 000 000" },
    { key: "created", label: "Ngày tham gia", placeholder: "09/08/2026" },
  ],
  statuses: [
    { value: "ACTIVE", label: "Hoạt động", tone: "positive" },
    { value: "INACTIVE", label: "Vô hiệu hóa", tone: "critical" },
  ],
};

export function UserManagement() {
  return <AdminResourceWorkspace definition={definition} service={service} />;
}
