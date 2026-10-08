import { Form, Link, useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import type { ReactNode } from "react";

export type AccountSection = "overview" | "orders" | "saved" | "addresses" | "settings";

const NAV: { key: AccountSection; label: string; to: string }[] = [
  { key: "overview", label: "Tổng quan", to: "/account" },
  { key: "orders", label: "Đơn hàng", to: "/account#orders" },
  { key: "saved", label: "Đã lưu", to: "/account#saved" },
  { key: "addresses", label: "Địa chỉ", to: "/account/addresses" },
  { key: "settings", label: "Cài đặt", to: "/account/profile" },
];

function initialsOf(name: string | null | undefined, email: string): string {
  const parts = (name?.trim() || email).split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
  return (last ? first.charAt(0) + last.charAt(0) : first.slice(0, 2)).toUpperCase();
}

/** Khung trang tài khoản: sidebar (desktop) / tab ngang (mobile) + nội dung. */
export function AccountShell({ active, children }: { active: AccountSection; children: ReactNode }) {
  const user = useRouteLoaderData<typeof rootLoader>("root")?.user ?? null;
  return (
    <div className="sp-account">
      <nav className="sp-account__nav" aria-label="Điều hướng tài khoản">
        {user ? (
          <div className="sp-account__who">
            <span className="sp-account__avatar" aria-hidden="true">{initialsOf(user.full_name, user.email)}</span>
            <span className="sp-account__id">
              <strong>{user.full_name?.trim() || user.email}</strong>
              {user.full_name ? <small>{user.email}</small> : null}
            </span>
          </div>
        ) : null}
        {NAV.map((item) => (
          <Link key={item.key} to={item.to} aria-current={item.key === active ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
        <Form method="post" action="/logout"><button type="submit">Đăng xuất</button></Form>
      </nav>
      <div className="sp-account__main">{children}</div>
    </div>
  );
}

export function PageHeading({ back, title, lead, action }: { back?: { to: string; label: string }; title: string; lead?: string; action?: ReactNode }) {
  return (
    <header className="sp-heading">
      <div>
        {back ? <Link className="sp-back" to={back.to}>← {back.label}</Link> : null}
        <h1>{title}</h1>
        {lead ? <p>{lead}</p> : null}
      </div>
      {action}
    </header>
  );
}
