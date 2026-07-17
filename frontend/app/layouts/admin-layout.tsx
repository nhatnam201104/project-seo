import { Outlet } from "react-router";
import type { Route } from "./+types/admin-layout";
import { AdminFooter } from "~/components/layout/admin/AdminFooter";
import { AdminHeader } from "~/components/layout/admin/AdminHeader";
import { MainLayout } from "~/components/layout/MainLayout";
import { requireAdmin } from "~/lib/auth.server";
import "~/components/layout/layout.css";

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await requireAdmin(request);
  return { user: auth.user };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <MainLayout
      variant="admin"
      header={<AdminHeader user={loaderData.user} />}
      footer={<AdminFooter />}
    >
      <Outlet />
    </MainLayout>
  );
}
