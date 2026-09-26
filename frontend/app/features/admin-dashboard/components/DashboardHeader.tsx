import type { DashboardPeriod } from "../lib/admin-dashboard.types";

interface DashboardHeaderProps {
  readonly period: DashboardPeriod;
  readonly periodLabel: string;
  readonly comparisonLabel: string;
  readonly onPeriodChange: (period: DashboardPeriod) => void;
}

export function DashboardHeader({
  period,
  periodLabel,
  comparisonLabel,
  onPeriodChange,
}: DashboardHeaderProps) {
  return (
    <header className="adm-dashboard-header">
      <div className="adm-dashboard-header__copy">
        <p className="adm-eyebrow">ProjectSale / Operations</p>
        <div className="adm-dashboard-header__title-row">
          <h1 id="admin-dashboard-heading">Tổng quan kinh doanh</h1>
          <span className="adm-demo-badge">Dữ liệu minh họa</span>
        </div>
        <p className="adm-dashboard-header__description">
          Theo dõi nhịp bán hàng, đơn cần xử lý và sức khỏe tồn kho tại một nơi.
        </p>
      </div>

      <div className="adm-filter-bar" aria-label="Bộ lọc kỳ báo cáo">
        <div className="adm-period-copy" aria-live="polite">
          <strong>{periodLabel}</strong>
          <span>{comparisonLabel}</span>
        </div>
        <div className="adm-segmented" aria-label="Chọn kỳ báo cáo">
          <button
            type="button"
            aria-pressed={period === "WEEK"}
            onClick={() => onPeriodChange("WEEK")}
          >
            Tuần
          </button>
          <button
            type="button"
            aria-pressed={period === "MONTH"}
            onClick={() => onPeriodChange("MONTH")}
          >
            Tháng
          </button>
        </div>
        <div className="adm-period-navigation" aria-label="Điều hướng kỳ">
          <button type="button" disabled aria-label="Kỳ trước">
            ←
          </button>
          <button type="button" disabled aria-label="Kỳ sau">
            →
          </button>
        </div>
      </div>
    </header>
  );
}
