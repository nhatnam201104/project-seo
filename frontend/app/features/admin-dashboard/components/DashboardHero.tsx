import type { DashboardData, MetricValue } from "../lib/admin-dashboard.types";
import {
  formatCount,
  formatCurrency,
  formatDelta,
} from "../lib/dashboard-format";

interface DashboardHeroProps {
  readonly metrics: DashboardData["metrics"];
}

interface SupportingMetricProps {
  readonly label: string;
  readonly metric: MetricValue;
  readonly formatValue: (value: number) => string;
}

function Delta({ metric }: { readonly metric: MetricValue }) {
  const direction =
    metric.changePercentage > 0
      ? "positive"
      : metric.changePercentage < 0
        ? "negative"
        : "neutral";

  return (
    <span className="adm-delta" data-direction={direction}>
      <span aria-hidden="true">
        {direction === "positive" ? "↑" : direction === "negative" ? "↓" : "—"}
      </span>
      {formatDelta(metric.changePercentage)}
      <span className="adm-visually-hidden"> {metric.previousLabel}</span>
    </span>
  );
}

function SupportingMetric({
  label,
  metric,
  formatValue,
}: SupportingMetricProps) {
  return (
    <article className="adm-supporting-metric">
      <div>
        <p>{label}</p>
        <strong>{formatValue(metric.value)}</strong>
      </div>
      <Delta metric={metric} />
    </article>
  );
}

export function DashboardHero({ metrics }: DashboardHeroProps) {
  return (
    <section className="adm-hero" aria-labelledby="completed-sales-heading">
      <article className="adm-hero__primary">
        <p className="adm-eyebrow">Đơn hoàn tất</p>
        <h2 id="completed-sales-heading">Doanh số đã ghi nhận</h2>
        <strong className="adm-hero__value">
          {formatCurrency(metrics.completedSales.value)}
        </strong>
        <div className="adm-hero__meta">
          <Delta metric={metrics.completedSales} />
          <span>Cơ sở để đọc xu hướng, không gồm đơn hủy hoặc hoàn tiền.</span>
        </div>
      </article>

      <div className="adm-hero__support" aria-label="Chỉ số hỗ trợ">
        <SupportingMetric
          label="Đơn tạo mới"
          metric={metrics.ordersCreated}
          formatValue={formatCount}
        />
        <SupportingMetric
          label="Giá trị đơn trung bình"
          metric={metrics.averageOrderValue}
          formatValue={formatCurrency}
        />
        <SupportingMetric
          label="Khách hàng mới"
          metric={metrics.newCustomers}
          formatValue={formatCount}
        />
      </div>
    </section>
  );
}
