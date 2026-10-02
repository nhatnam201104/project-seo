import { Form, Link } from "react-router";
import type { ReactNode } from "react";

export type AccountSection = "overview" | "orders" | "saved" | "addresses" | "settings";

const NAV: { key: AccountSection; label: string; to: string }[] = [
  { key: "overview", label: "Overview", to: "/account" },
  { key: "orders", label: "Orders", to: "/account#orders" },
  { key: "saved", label: "Saved", to: "/account#saved" },
  { key: "addresses", label: "Addresses", to: "/account/addresses" },
  { key: "settings", label: "Settings", to: "/account/profile" },
];

/** Khung trang tài khoản: sidebar (desktop) / tab ngang (mobile) + nội dung. */
export function AccountShell({ active, children }: { active: AccountSection; children: ReactNode }) {
  return (
    <div className="sp-account">
      <nav className="sp-account__nav" aria-label="Điều hướng tài khoản">
        {NAV.map((item, i) => (
          <Link key={item.key} to={item.to} aria-current={item.key === active ? "page" : undefined}>
            {item.label}
            <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          </Link>
        ))}
        <Form method="post" action="/logout"><button type="submit">Logout</button></Form>
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
