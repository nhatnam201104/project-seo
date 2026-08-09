import { useEffect, useRef } from "react";
import { NavLink } from "react-router";

const NAV_ITEMS = [
  { to: "/admin", label: "Tổng quan", icon: "⌁", end: true },
  { to: "/admin/products", label: "Sản phẩm & kho", icon: "◇" },
  { to: "/admin/orders", label: "Đơn hàng", icon: "↗" },
  { to: "/admin/catalog", label: "Danh mục & thương hiệu", icon: "⊞" },
  { to: "/admin/promotions", label: "Khuyến mãi", icon: "%" },
  { to: "/admin/blog", label: "Bài viết", icon: "¶" },
  { to: "/admin/reviews", label: "Đánh giá", icon: "✦" },
  { to: "/admin/users", label: "Người dùng", icon: "○" },
] as const;

interface AdminSidebarProps {
  readonly collapsed: boolean;
  readonly mobileOpen: boolean;
  readonly onCollapseToggle: () => void;
  readonly onCloseMobile: () => void;
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onCollapseToggle,
  onCloseMobile,
}: AdminSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseMobile();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <button
        className="admin-sidebar__backdrop"
        type="button"
        aria-label="Đóng điều hướng"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={onCloseMobile}
      />
      <aside
        ref={sidebarRef}
        className="admin-sidebar"
        data-collapsed={collapsed}
        data-mobile-open={mobileOpen}
        aria-label="Điều hướng quản trị chính"
        tabIndex={-1}
      >
        <div className="admin-sidebar__intro">
          <span className="admin-sidebar__pulse" aria-hidden="true" />
          <div>
            <strong>Operations</strong>
            <span>8 workspace</span>
          </div>
          <button
            className="admin-sidebar__mobile-close"
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng menu quản trị"
          >
            ×
          </button>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Các trang quản trị">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item && item.end}
              title={collapsed ? item.label : undefined}
              onClick={onCloseMobile}
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              <span className="admin-sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="admin-sidebar__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__foot">
          <p>
            <span aria-hidden="true">●</span> Prototype nội bộ
          </p>
          <button
            type="button"
            onClick={onCollapseToggle}
            aria-expanded={!collapsed}
          >
            <span aria-hidden="true">{collapsed ? "→" : "←"}</span>
            <span className="admin-sidebar__label">Thu gọn menu</span>
          </button>
        </div>
      </aside>
    </>
  );
}
