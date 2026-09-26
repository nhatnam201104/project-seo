import type { OrderStatusDatum } from "../lib/admin-dashboard.types";
import { formatCount } from "../lib/dashboard-format";

interface OrderStatusBreakdownProps {
  readonly statuses: ReadonlyArray<OrderStatusDatum>;
}

export function OrderStatusBreakdown({ statuses }: OrderStatusBreakdownProps) {
  const maximumCount = Math.max(...statuses.map((status) => status.count), 1);

  return (
    <section
      className="adm-panel adm-statuses"
      aria-labelledby="statuses-heading"
    >
      <div className="adm-panel__heading">
        <div>
          <p className="adm-eyebrow">Dòng chảy đơn hàng</p>
          <h2 id="statuses-heading">Đơn theo trạng thái</h2>
        </div>
        <p>Mỗi trạng thái có nhãn và ký hiệu riêng, không phụ thuộc màu sắc.</p>
      </div>

      <ol className="adm-status-list">
        {statuses.map((status) => {
          const widthPercentage = (status.count / maximumCount) * 100;
          return (
            <li key={status.status} data-status={status.status}>
              <div className="adm-status-list__label">
                <span className="adm-status-list__marker" aria-hidden="true" />
                <span>{status.label}</span>
                <strong>{formatCount(status.count)}</strong>
              </div>
              <div className="adm-status-list__track" aria-hidden="true">
                <span
                  style={{ transform: `scaleX(${widthPercentage / 100})` }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <details className="adm-data-table">
        <summary>Bảng dữ liệu trạng thái đơn</summary>
        <div className="adm-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Trạng thái</th>
                <th scope="col">Số đơn</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((status) => (
                <tr key={status.status}>
                  <th scope="row">{status.label}</th>
                  <td>{formatCount(status.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
