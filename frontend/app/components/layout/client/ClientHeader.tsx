import { Form, Link } from "react-router";
import type { AuthUser } from "~/features/auth/api/auth.types";

type ClientHeaderProps = { user: AuthUser | null };

export function ClientHeader({ user }: ClientHeaderProps) {
  return (
    <header className="client-header">
      <Link className="client-header__brand" to="/">ProjectSale</Link>
      <nav className="client-header__nav" aria-label="Điều hướng khách hàng">
        <Link className="client-header__action" to="/products">Sản phẩm</Link>
        {user ? (
          <>
            <Link className="client-header__action" to="/account">
              {user.full_name ?? user.email}
            </Link>
            {user.role === "ADMIN" ? (
              <Link className="client-header__action" to="/admin">Quản trị</Link>
            ) : null}
            <Form method="post" action="/logout">
              <button className="client-header__action client-header__button" type="submit">Đăng xuất</button>
            </Form>
          </>
        ) : (
          <Link className="client-header__action" to="/login">Đăng nhập</Link>
        )}
      </nav>
    </header>
  );
}
