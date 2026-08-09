import { describe, expect, it, vi } from "vitest";
import { DASHBOARD_MOCK_DATA } from "~/features/admin-dashboard/data/admin-dashboard.mock";
import type { AdminDashboardDataSource } from "~/features/admin-dashboard/lib/admin-dashboard.types";
import { createAdminDashboardService } from "~/features/admin-dashboard/services/admin-dashboard.service";

describe("admin dashboard service", () => {
  it("keeps the UI independent from the active data source", async () => {
    const getDashboard = vi
      .fn<AdminDashboardDataSource["getDashboard"]>()
      .mockResolvedValue(DASHBOARD_MOCK_DATA.MONTH);
    const service = createAdminDashboardService({ getDashboard });

    await expect(service.loadDashboard("MONTH")).resolves.toBe(
      DASHBOARD_MOCK_DATA.MONTH,
    );
    expect(getDashboard).toHaveBeenCalledWith("MONTH");
  });

  it("preserves source failures for the UI error boundary", async () => {
    const sourceFailure = new Error("mock source unavailable");
    const getDashboard = vi
      .fn<AdminDashboardDataSource["getDashboard"]>()
      .mockRejectedValue(sourceFailure);
    const service = createAdminDashboardService({ getDashboard });

    await expect(service.loadDashboard("WEEK")).rejects.toBe(sourceFailure);
  });
});
