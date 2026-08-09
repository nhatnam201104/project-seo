import { useEffect, useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardHero } from "./DashboardHero";
import { OperationsQueue } from "./OperationsQueue";
import { OrderStatusBreakdown } from "./OrderStatusBreakdown";
import { SalesTrendChart } from "./SalesTrendChart";
import { TopProductsRanking } from "./TopProductsRanking";
import { DASHBOARD_MOCK_DATA } from "../data/admin-dashboard.mock";
import { mockAdminDashboardDataSource } from "../data/mock-admin-dashboard.data-source";
import type {
  DashboardData,
  DashboardPeriod,
  TrendMetric,
} from "../lib/admin-dashboard.types";
import {
  createAdminDashboardService,
  type AdminDashboardService,
} from "../services/admin-dashboard.service";
import "../styles/admin-dashboard.css";

const defaultAdminDashboardService = createAdminDashboardService(
  mockAdminDashboardDataSource,
);

interface AdminDashboardProps {
  readonly service?: AdminDashboardService;
}

export function AdminDashboard({
  service = defaultAdminDashboardService,
}: AdminDashboardProps) {
  const [period, setPeriod] = useState<DashboardPeriod>("WEEK");
  const [metric, setMetric] = useState<TrendMetric>("SALES");
  const [dashboard, setDashboard] = useState<DashboardData>(
    DASHBOARD_MOCK_DATA.WEEK,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;
    setIsRefreshing(true);
    setErrorMessage(null);

    service
      .loadDashboard(period)
      .then((nextDashboard) => {
        if (isCurrentRequest) {
          setDashboard(nextDashboard);
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setErrorMessage("Không thể tải dữ liệu minh họa. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsRefreshing(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [period, service]);

  return (
    <div
      className="adm-dashboard"
      role="region"
      aria-labelledby="admin-dashboard-heading"
      aria-busy={isRefreshing}
    >
      <DashboardHeader
        period={period}
        periodLabel={dashboard.periodLabel}
        comparisonLabel={dashboard.comparisonLabel}
        onPeriodChange={setPeriod}
      />

      {errorMessage ? (
        <div className="adm-alert" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <DashboardHero metrics={dashboard.metrics} />

      <div className="adm-dashboard__trend-grid">
        <div>
          <div className="adm-metric-filter" aria-label="Chọn chỉ số biểu đồ">
            <span>Chỉ số xu hướng</span>
            <div className="adm-segmented">
              <button
                type="button"
                aria-pressed={metric === "SALES"}
                onClick={() => setMetric("SALES")}
              >
                Doanh số
              </button>
              <button
                type="button"
                aria-pressed={metric === "ORDERS"}
                onClick={() => setMetric("ORDERS")}
              >
                Số đơn
              </button>
            </div>
          </div>
          <SalesTrendChart points={dashboard.trend} metric={metric} />
        </div>
        <OperationsQueue operations={dashboard.operations} />
      </div>

      <div className="adm-dashboard__lower-grid">
        <OrderStatusBreakdown statuses={dashboard.orderStatuses} />
        <TopProductsRanking products={dashboard.topProducts} />
      </div>
    </div>
  );
}
