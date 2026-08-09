import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition } from "~/features/admin-shared/lib/admin-resource.types";
import { ADMIN_BLOG_MOCK } from "../data/blog.mock";

const service = createMockAdminResourceService(ADMIN_BLOG_MOCK);
const definition: AdminResourceDefinition = {
  eyebrow: "Editorial / SEO",
  title: "Bài viết",
  entityLabel: "Bài viết",
  countLabel: "bản thảo và bài đã đăng",
  description:
    "Lên lịch nội dung tư vấn, kiểm soát trạng thái xuất bản và giữ cấu trúc slug thân thiện với SEO.",
  searchPlaceholder: "Tìm tiêu đề, tác giả hoặc slug…",
  createLabel: "Viết bài mới",
  columns: [
    { key: "author", label: "Tác giả" },
    { key: "slug", label: "Slug" },
    { key: "publish", label: "Xuất bản" },
  ],
  formFields: [
    { key: "author", label: "Tác giả", placeholder: "Minh Anh" },
    { key: "slug", label: "Slug", placeholder: "slug-tu-dong" },
    { key: "publish", label: "Ngày xuất bản", placeholder: "Chưa xuất bản" },
  ],
  statuses: [
    { value: "DRAFT", label: "Bản nháp", tone: "warning" },
    { value: "PUBLISHED", label: "Đã xuất bản", tone: "positive" },
  ],
};

export function BlogManagement() {
  return <AdminResourceWorkspace definition={definition} service={service} />;
}
