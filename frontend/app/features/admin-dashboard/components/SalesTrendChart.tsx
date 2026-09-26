import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import { useMounted } from "~/hooks/useMounted";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import type { TrendMetric, TrendPoint } from "../lib/admin-dashboard.types";
import {
  formatCompactCurrency,
  formatCount,
  formatCurrency,
} from "../lib/dashboard-format";

interface SalesTrendChartProps {
  readonly points: ReadonlyArray<TrendPoint>;
  readonly metric: TrendMetric;
}

interface MetricPresentation {
  readonly title: string;
  readonly description: string;
  readonly dataKey: "completedSales" | "ordersCreated";
  readonly tableLabel: string;
  readonly valueLabel: string;
  readonly formatValue: (value: number) => string;
  readonly formatAxisValue: (value: number) => string;
}

const SALES_PRESENTATION: MetricPresentation = {
  title: "Nhịp doanh số",
  description: "Doanh số từ các đơn hoàn tất theo từng ngày trong kỳ.",
  dataKey: "completedSales",
  tableLabel: "Bảng dữ liệu doanh số",
  valueLabel: "Doanh số",
  formatValue: formatCurrency,
  formatAxisValue: formatCompactCurrency,
};

const ORDERS_PRESENTATION: MetricPresentation = {
  title: "Nhịp đơn hàng",
  description: "Số đơn được tạo theo từng ngày trong kỳ.",
  dataKey: "ordersCreated",
  tableLabel: "Bảng dữ liệu số đơn",
  valueLabel: "Số đơn",
  formatValue: formatCount,
  formatAxisValue: formatCount,
};

function getPresentation(metric: TrendMetric): MetricPresentation {
  return metric === "SALES" ? SALES_PRESENTATION : ORDERS_PRESENTATION;
}

function TrendTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<TooltipValueType, number | string>) {
  if (!active || payload.length === 0) {
    return null;
  }

  const firstPayload = payload[0];
  if (!firstPayload || typeof firstPayload.value !== "number") {
    return null;
  }

  const metric = firstPayload.dataKey === "completedSales" ? "SALES" : "ORDERS";
  const presentation = getPresentation(metric);

  return (
    <div className="adm-chart-tooltip">
      <span>{label}</span>
      <strong>{presentation.formatValue(firstPayload.value)}</strong>
    </div>
  );
}

export function SalesTrendChart({ points, metric }: SalesTrendChartProps) {
  const isMounted = useMounted();
  const prefersReducedMotion = useReducedMotion();
  const presentation = getPresentation(metric);

  return (
    <section className="adm-panel adm-trend" aria-labelledby="trend-heading">
      <div className="adm-panel__heading">
        <div>
          <p className="adm-eyebrow">Tín hiệu theo thời gian</p>
          <h2 id="trend-heading">{presentation.title}</h2>
        </div>
        <p>{presentation.description}</p>
      </div>

      <div
        className="adm-trend__visual"
        role="img"
        aria-label={presentation.description}
      >
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={points}
              margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
              accessibilityLayer
            >
              <defs>
                <linearGradient
                  id={`adm-trend-${metric.toLowerCase()}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--adm-chart-accent)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--adm-chart-accent)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--adm-chart-grid)" />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: "var(--adm-chart-axis)" }}
                tickLine={false}
                minTickGap={24}
                tick={{ fill: "var(--adm-ink-muted)", fontSize: 12 }}
              />
              <YAxis
                width={72}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--adm-ink-muted)", fontSize: 12 }}
                tickFormatter={presentation.formatAxisValue}
              />
              <Tooltip
                content={TrendTooltip}
                cursor={{ stroke: "var(--adm-ink-muted)", strokeWidth: 1 }}
                isAnimationActive={!prefersReducedMotion}
              />
              <Area
                type="monotone"
                dataKey={presentation.dataKey}
                name={presentation.valueLabel}
                stroke="var(--adm-chart-accent)"
                strokeWidth={2}
                fill={`url(#adm-trend-${metric.toLowerCase()})`}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: "var(--adm-surface)",
                }}
                isAnimationActive={!prefersReducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="adm-chart-fallback">
            Biểu đồ sẽ hiển thị sau khi trang sẵn sàng.
          </p>
        )}
      </div>

      <details className="adm-data-table">
        <summary>{presentation.tableLabel}</summary>
        <div className="adm-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Ngày</th>
                <th scope="col">{presentation.valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.label}>
                  <th scope="row">{point.label}</th>
                  <td>
                    {presentation.formatValue(point[presentation.dataKey])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
