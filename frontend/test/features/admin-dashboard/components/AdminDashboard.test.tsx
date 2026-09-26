import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DASHBOARD_MOCK_DATA } from "~/features/admin-dashboard/data/admin-dashboard.mock";
import type {
  DashboardData,
  DashboardPeriod,
} from "~/features/admin-dashboard/lib/admin-dashboard.types";
import type { AdminDashboardService } from "~/features/admin-dashboard/services/admin-dashboard.service";
import { AdminDashboard } from "~/features/admin-dashboard/components/AdminDashboard";

vi.mock("~/hooks/useMounted", () => ({
  useMounted: () => false,
}));

afterEach(cleanup);

function createService(): AdminDashboardService {
  return {
    loadDashboard: vi.fn(
      async (period: DashboardPeriod) => DASHBOARD_MOCK_DATA[period],
    ),
  };
}

function completeRequest(
  resolveRequest: ((data: DashboardData) => void) | null,
  data: DashboardData,
): void {
  if (!resolveRequest) {
    throw new Error("Dashboard request resolver was not initialized.");
  }

  resolveRequest(data);
}

describe("AdminDashboard", () => {
  it("renders the commerce overview and clearly labels mock data", async () => {
    render(<AdminDashboard service={createService()} />);

    expect(
      screen.getByRole("heading", { name: "Tổng quan kinh doanh" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dữ liệu minh họa")).toBeInTheDocument();
    expect(await screen.findByText("486.400.000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Đơn chờ xác nhận")).toBeInTheDocument();
    expect(screen.getByText("MORAINE Core 01")).toBeInTheDocument();
  });

  it("switches period fixtures from one shared filter row", async () => {
    const user = userEvent.setup();
    const service = createService();
    render(<AdminDashboard service={service} />);

    await screen.findByText(DASHBOARD_MOCK_DATA.WEEK.periodLabel);
    await user.click(screen.getByRole("button", { name: "Tháng" }));

    expect(await screen.findByText(DASHBOARD_MOCK_DATA.MONTH.periodLabel)).toBeInTheDocument();
    await waitFor(() =>
      expect(service.loadDashboard).toHaveBeenLastCalledWith("MONTH"),
    );
    expect(screen.getByRole("button", { name: "Tháng" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches the trend between sales and order count", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard service={createService()} />);

    expect(
      await screen.findByRole("heading", { name: "Nhịp doanh số" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Số đơn" }));

    expect(
      screen.getByRole("heading", { name: "Nhịp đơn hàng" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bảng dữ liệu số đơn")).toBeInTheDocument();
  });

  it("keeps previous data visible while another period refreshes", async () => {
    let resolveMonth: ((data: typeof DASHBOARD_MOCK_DATA.MONTH) => void) | null = null;
    const service: AdminDashboardService = {
      loadDashboard: vi.fn((period: DashboardPeriod) => {
        if (period === "WEEK") {
          return Promise.resolve(DASHBOARD_MOCK_DATA.WEEK);
        }

        return new Promise<typeof DASHBOARD_MOCK_DATA.MONTH>((resolve) => {
          resolveMonth = resolve;
        });
      }),
    };
    const user = userEvent.setup();
    render(<AdminDashboard service={service} />);

    await screen.findByText("486.400.000 ₫");
    await user.click(screen.getByRole("button", { name: "Tháng" }));

    expect(screen.getByText("486.400.000 ₫")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Tổng quan kinh doanh" }),
    ).toHaveAttribute("aria-busy", "true");

    completeRequest(resolveMonth, DASHBOARD_MOCK_DATA.MONTH);

    expect(await screen.findByText("2.088.000.000 ₫")).toBeInTheDocument();
  });
});
