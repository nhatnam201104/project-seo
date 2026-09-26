import type { ReactNode } from "react";

type MainLayoutProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  variant: "client" | "admin";
};

/** Shared semantic shell. Client/admin layouts provide their own navigation. */
export function MainLayout({ header, footer, children, variant }: MainLayoutProps) {
  return (
    <div className={`app-shell app-shell--${variant}`}>
      {header}
      <main className="app-shell__main">{children}</main>
      {footer}
    </div>
  );
}
