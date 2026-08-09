import type {
  AdminDashboardDataSource,
  DashboardData,
  DashboardPeriod,
} from "../lib/admin-dashboard.types";

export interface AdminDashboardService {
  loadDashboard(period: DashboardPeriod): Promise<DashboardData>;
}

export function createAdminDashboardService(
  dataSource: AdminDashboardDataSource,
): AdminDashboardService {
  return Object.freeze({
    loadDashboard: (period: DashboardPeriod): Promise<DashboardData> =>
      dataSource.getDashboard(period),
  });
}
