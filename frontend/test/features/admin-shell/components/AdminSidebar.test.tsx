import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "~/features/admin-shell/components/AdminSidebar";

afterEach(cleanup);

function renderSidebar(overrides: Partial<React.ComponentProps<typeof AdminSidebar>> = {}) {
  const props = {
    collapsed: false,
    mobileOpen: false,
    onCollapseToggle: vi.fn(),
    onCloseMobile: vi.fn(),
    ...overrides,
  };
  const router = createMemoryRouter([{ path: "*", element: <AdminSidebar {...props} /> }], {
    initialEntries: ["/admin/products"],
  });
  render(<RouterProvider router={router} />);
  return props;
}

describe("AdminSidebar", () => {
  it("marks the current workspace and exposes all eight destinations", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Sản phẩm & kho" })).toHaveClass("is-active");
    expect(screen.getAllByRole("link")).toHaveLength(8);
  });

  it("supports collapse and Escape-close interactions", async () => {
    const user = userEvent.setup();
    const props = renderSidebar({ mobileOpen: true });
    await user.click(screen.getByRole("button", { name: "Thu gọn menu" }));
    expect(props.onCollapseToggle).toHaveBeenCalledOnce();
    await user.keyboard("{Escape}");
    expect(props.onCloseMobile).toHaveBeenCalled();
  });

  it("centers navigation icons when the desktop sidebar is collapsed", () => {
    renderSidebar({ collapsed: true });
    const productLink = screen.getByRole("link", { name: "Sản phẩm & kho" });
    expect(productLink).toHaveAttribute("title", "Sản phẩm & kho");

    const css = readFileSync("app/features/admin-shell/styles/admin-shell.css", "utf8");
    expect(css).toMatch(
      /\.admin-sidebar\[data-collapsed="true"\] \.admin-sidebar__nav a,[\s\S]*?justify-content:\s*center;/,
    );
  });
});
