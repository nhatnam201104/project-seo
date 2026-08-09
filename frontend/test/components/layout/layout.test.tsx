import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { ROLE } from "~/core/domain/enums";
import { AdminFooter } from "~/components/layout/admin/AdminFooter";
import { AdminHeader } from "~/components/layout/admin/AdminHeader";
import { ClientFooter } from "~/components/layout/client/ClientFooter";
import { ClientHeader } from "~/components/layout/client/ClientHeader";
import { MainLayout } from "~/components/layout/MainLayout";

function renderWithRouter(element: ReactElement) {
  const router = createMemoryRouter([{ path: "*", element }]);
  return render(<RouterProvider router={router} />);
}

afterEach(cleanup);

describe("application layout shells", () => {
  it("renders the client shell with guest navigation", () => {
    renderWithRouter(
      <MainLayout
        variant="client"
        header={<ClientHeader user={null} />}
        footer={<ClientFooter />}
      >
        <h1>Danh sách sản phẩm</h1>
      </MainLayout>,
    );

    expect(screen.getByRole("banner")).toHaveClass("client-header");
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("main")).toHaveTextContent("Danh sách sản phẩm");
    expect(screen.getByRole("contentinfo")).toHaveClass("client-footer");
  });

  it("shows authenticated client actions and the admin destination", () => {
    renderWithRouter(
      <ClientHeader
        user={{
          email: "admin@projectsale.vn",
          full_name: "Quản trị viên",
          phone: null,
          role: ROLE.ADMIN,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Quản trị viên" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "Quản trị" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });

  it("renders the dedicated admin header and footer", () => {
    renderWithRouter(
      <MainLayout
        variant="admin"
        header={<AdminHeader theme="light" onThemeToggle={() => undefined} />}
        footer={<AdminFooter />}
      >
        <h1>Bảng điều khiển</h1>
      </MainLayout>,
    );

    expect(screen.getByRole("banner")).toHaveClass("admin-header");
    expect(screen.getByRole("navigation", { name: "Điều hướng quản trị" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chuyển sang giao diện tối" })).toHaveTextContent(
      "Giao diện sáng",
    );
    expect(screen.getByRole("contentinfo")).toHaveClass("admin-footer");
  });
});
