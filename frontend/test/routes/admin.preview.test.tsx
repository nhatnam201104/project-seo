import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/admin-dashboard/components/AdminDashboard", () => ({
  AdminDashboard: () => (
    <section>
      <h1>Tổng quan kinh doanh</h1>
      <span>Dữ liệu minh họa</span>
    </section>
  ),
}));

import AdminLayout, * as adminLayoutModule from "~/layouts/admin-layout";
import AdminRoute, * as adminRouteModule from "~/routes/admin";

afterEach(cleanup);

describe("admin dashboard preview route", () => {
  it("does not expose an authentication loader in the mock-only prototype", () => {
    expect("loader" in adminLayoutModule).toBe(false);
    expect("loader" in adminRouteModule).toBe(false);
  });

  it("renders the public mock dashboard inside the admin shell", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/admin",
          element: <AdminLayout />,
          children: [{ index: true, element: <AdminRoute /> }],
        },
      ],
      { initialEntries: ["/admin"] },
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Tổng quan kinh doanh" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dữ liệu minh họa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Chuyển sang giao diện tối/i })).toBeInTheDocument();
  });
});
