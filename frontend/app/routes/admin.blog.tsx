import type { Route } from "./+types/admin.blog";
import { BlogManagement } from "~/features/admin-blog/components/BlogManagement";

export function meta(_: Route.MetaArgs) { return [{ title: "Bài viết — ProjectSale Admin" }]; }
export default function AdminBlogRoute() { return <BlogManagement />; }
