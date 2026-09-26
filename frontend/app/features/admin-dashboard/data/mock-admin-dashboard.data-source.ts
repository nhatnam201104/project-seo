import type {
  AdminDashboardDataSource,
  DashboardData,
  DashboardPeriod,
} from "../lib/admin-dashboard.types";
import { DASHBOARD_MOCK_DATA } from "./admin-dashboard.mock";

export const mockAdminDashboardDataSource: AdminDashboardDataSource = Object.freeze({
  getDashboard(period: DashboardPeriod): Promise<DashboardData> {
    return Promise.resolve(DASHBOARD_MOCK_DATA[period]);
  },
});
