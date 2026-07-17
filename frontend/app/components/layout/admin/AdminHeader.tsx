import { Form, Link } from "react-router";
import type { AuthUser } from "~/features/auth/api/auth.types";

type AdminHeaderProps = { user: AuthUser };

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <Link className="admin-header__brand" to="/admin">ProjectSale Admin</Link>
      <nav className="admin-header__nav" aria-label="Điều hướng quản trị">
        <span className="admin-header__user">{user.full_name ?? user.email}</span>
        <Link className="admin-header__action" to="/products">Cửa hàng</Link>
        <Link className="admin-header__action" to="/account">Tài khoản</Link>
        <Form method="post" action="/logout">
          <button className="admin-header__action admin-header__button" type="submit">Đăng xuất</button>
        </Form>
      </nav>
    </header>
  );
}
