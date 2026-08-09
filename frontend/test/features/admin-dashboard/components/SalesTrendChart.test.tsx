import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DASHBOARD_MOCK_DATA } from "~/features/admin-dashboard/data/admin-dashboard.mock";
import { SalesTrendChart } from "~/features/admin-dashboard/components/SalesTrendChart";

vi.mock("~/hooks/useMounted", () => ({
  useMounted: () => false,
}));

afterEach(cleanup);

describe("SalesTrendChart", () => {
  it("provides a readable table when the visual chart is unavailable", () => {
    render(
      <SalesTrendChart
        metric="SALES"
        points={DASHBOARD_MOCK_DATA.WEEK.trend}
      />,
    );

    expect(screen.getByText("Biểu đồ sẽ hiển thị sau khi trang sẵn sàng.")).toBeInTheDocument();
    expect(screen.getByText("Bảng dữ liệu doanh số")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Doanh số" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "58.400.000 ₫" })).toBeInTheDocument();
  });

  it("changes the semantic description for order count", () => {
    render(
      <SalesTrendChart
        metric="ORDERS"
        points={DASHBOARD_MOCK_DATA.WEEK.trend}
      />,
    );

    expect(screen.getByRole("heading", { name: "Nhịp đơn hàng" })).toBeInTheDocument();
    expect(screen.getByText("Bảng dữ liệu số đơn")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Số đơn" })).toBeInTheDocument();
  });
});
