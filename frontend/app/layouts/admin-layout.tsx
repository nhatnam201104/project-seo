import { Outlet } from "react-router";
import { AdminFooter } from "~/components/layout/admin/AdminFooter";
import { AdminHeader } from "~/components/layout/admin/AdminHeader";
import { MainLayout } from "~/components/layout/MainLayout";
import { useAdminTheme } from "~/features/admin-dashboard/hooks/useAdminTheme";
import { AdminSidebar } from "~/features/admin-shell/components/AdminSidebar";
import { useAdminSidebar } from "~/features/admin-shell/hooks/useAdminSidebar";
import "~/components/layout/layout.css";
import "~/features/admin-shell/styles/admin-shell.css";

export default function AdminLayout() {
  const { theme, toggleTheme } = useAdminTheme();
  const sidebar = useAdminSidebar();

  return (
    <div className="admin-preview" data-theme={theme}>
      <MainLayout
        variant="admin"
        header={
          <AdminHeader
            theme={theme}
            onThemeToggle={toggleTheme}
            onMenuToggle={sidebar.openMobile}
          />
        }
        footer={<AdminFooter />}
      >
        <div className="admin-shell-body">
          <AdminSidebar
            collapsed={sidebar.isCollapsed}
            mobileOpen={sidebar.isMobileOpen}
            onCollapseToggle={sidebar.toggleCollapsed}
            onCloseMobile={sidebar.closeMobile}
          />
          <div className="admin-shell-content">
            <Outlet />
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
