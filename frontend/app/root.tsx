import { useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import type { Route } from "./+types/root";
import { getAuth } from "~/lib/auth.server";
import { useAuthStore } from "~/stores";
import "./app.css";

/**
 * Root loader: cung cấp user (nếu có) cho TOÀN app từ session server. Đây là
 * nguồn để đồng bộ auth store phía client (chỉ để hiển thị/điều hướng).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  return { user: auth.user };
}

export const links: Route.LinksFunction = () => [
  // Khai báo favicon để trình duyệt dùng file này thay vì tự dò /favicon.ico
  // (request /favicon.ico không khớp route nào → SSR handler ném lỗi "No route matches").
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const setUser = useAuthStore((s) => s.setUser);

  // Đồng bộ user từ server (nguồn xác thực) vào store hiển thị phía client.
  useEffect(() => {
    setUser(loaderData.user);
  }, [loaderData.user, setUser]);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Đã xảy ra lỗi";
  let detail = "Vui lòng thử lại sau.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Không tìm thấy trang" : "Lỗi";
    detail = error.statusText || detail;
  } else if (import.meta.env.DEV && error instanceof Error) {
    detail = error.message;
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>{message}</h1>
      <p>{detail}</p>
    </main>
  );
}
