import type { DashboardOperations } from "../lib/admin-dashboard.types";
import { formatCount } from "../lib/dashboard-format";

interface OperationsQueueProps {
  readonly operations: DashboardOperations;
}

interface OperationItemProps {
  readonly label: string;
  readonly detail: string;
  readonly value: number;
  readonly severity: "attention" | "critical" | "review";
  readonly symbol: string;
}

function OperationItem({
  label,
  detail,
  value,
  severity,
  symbol,
}: OperationItemProps) {
  return (
    <li className="adm-operation" data-severity={severity}>
      <span className="adm-operation__symbol" aria-hidden="true">
        {symbol}
      </span>
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <b
        aria-label={`${formatCount(value)} ${label.toLocaleLowerCase("vi-VN")}`}
      >
        {formatCount(value)}
      </b>
    </li>
  );
}

export function OperationsQueue({ operations }: OperationsQueueProps) {
  return (
    <aside
      className="adm-panel adm-operations"
      aria-labelledby="operations-heading"
    >
      <div className="adm-panel__heading">
        <div>
          <p className="adm-eyebrow">Cần xử lý hôm nay</p>
          <h2 id="operations-heading">Hàng đợi vận hành</h2>
        </div>
        <p>Ưu tiên công việc ảnh hưởng trực tiếp đến khách hàng và tồn kho.</p>
      </div>
      <ul>
        <OperationItem
          label="Đơn chờ xác nhận"
          detail="Kiểm tra thanh toán và khả năng giao"
          value={operations.pendingOrders}
          severity="attention"
          symbol="!"
        />
        <OperationItem
          label="Biến thể tồn kho thấp"
          detail="Số lượng đã chạm ngưỡng cảnh báo"
          value={operations.lowStockVariants}
          severity="critical"
          symbol="↓"
        />
        <OperationItem
          label="Đánh giá chờ duyệt"
          detail="Cần kiểm tra trước khi công khai"
          value={operations.pendingReviews}
          severity="review"
          symbol="◆"
        />
      </ul>
    </aside>
  );
}
