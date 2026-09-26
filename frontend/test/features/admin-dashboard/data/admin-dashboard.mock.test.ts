import { describe, expect, it } from "vitest";
import { DASHBOARD_MOCK_DATA } from "~/features/admin-dashboard/data/admin-dashboard.mock";

describe("admin dashboard mock contract", () => {
  it("provides complete immutable week and month fixtures", () => {
    expect(DASHBOARD_MOCK_DATA.WEEK.trend).toHaveLength(7);
    expect(DASHBOARD_MOCK_DATA.MONTH.trend).toHaveLength(30);
    expect(Object.isFrozen(DASHBOARD_MOCK_DATA)).toBe(true);
    expect(Object.isFrozen(DASHBOARD_MOCK_DATA.WEEK)).toBe(true);
    expect(Object.isFrozen(DASHBOARD_MOCK_DATA.MONTH.trend)).toBe(true);
  });

  it.each(["WEEK", "MONTH"] as const)(
    "keeps %s totals internally plausible",
    (period) => {
      const dashboard = DASHBOARD_MOCK_DATA[period];
      const statusTotal = dashboard.orderStatuses.reduce(
        (total, status) => total + status.count,
        0,
      );
      const topProductSales = dashboard.topProducts.reduce(
        (total, product) => total + product.completedSales,
        0,
      );
      const trendSales = dashboard.trend.reduce(
        (total, point) => total + point.completedSales,
        0,
      );

      expect(statusTotal).toBe(dashboard.metrics.ordersCreated.value);
      expect(trendSales).toBe(dashboard.metrics.completedSales.value);
      expect(topProductSales).toBeLessThanOrEqual(
        dashboard.metrics.completedSales.value,
      );
      expect(dashboard.orderStatuses).toHaveLength(6);
      expect(dashboard.topProducts).toHaveLength(5);
    },
  );
});
