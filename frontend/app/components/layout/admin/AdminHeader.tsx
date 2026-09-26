import { Link } from "react-router";
import type { AdminTheme } from "~/features/admin-dashboard/lib/admin-dashboard.types";

interface AdminHeaderProps {
  readonly theme: AdminTheme;
  readonly onThemeToggle: () => void;
  readonly onMenuToggle?: () => void;
}

export function AdminHeader({ theme, onThemeToggle, onMenuToggle }: AdminHeaderProps) {
  const nextThemeLabel = theme === "light" ? "tối" : "sáng";

  return (
    <header className="admin-header">
      <div className="admin-header__identity">
        <button
          className="admin-header__menu"
          type="button"
          onClick={onMenuToggle}
          aria-label="Mở menu quản trị"
        >
          ☰
        </button>
        <Link className="admin-header__brand" to="/admin">
          <span>ProjectSale</span>
          <small>Control room</small>
        </Link>
      </div>
      <nav className="admin-header__nav" aria-label="Điều hướng quản trị">
        <span className="admin-header__preview">Prototype nội bộ</span>
        <Link className="admin-header__action" to="/products">Xem cửa hàng</Link>
        <button
          className="admin-header__theme"
          type="button"
          onClick={onThemeToggle}
          aria-label={`Chuyển sang giao diện ${nextThemeLabel}`}
        >
          <span aria-hidden="true">{theme === "light" ? "◐" : "☼"}</span>
          {theme === "light" ? "Giao diện sáng" : "Giao diện tối"}
        </button>
      </nav>
    </header>
  );
}
