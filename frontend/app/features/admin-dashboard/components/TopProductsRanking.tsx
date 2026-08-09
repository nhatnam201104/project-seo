import type { TopProductDatum } from "../lib/admin-dashboard.types";
import { formatCount, formatCurrency } from "../lib/dashboard-format";

interface TopProductsRankingProps {
  readonly products: ReadonlyArray<TopProductDatum>;
}

export function TopProductsRanking({ products }: TopProductsRankingProps) {
  const maximumQuantity = Math.max(
    ...products.map((product) => product.quantity),
    1,
  );

  return (
    <section
      className="adm-panel adm-products"
      aria-labelledby="products-heading"
    >
      <div className="adm-panel__heading">
        <div>
          <p className="adm-eyebrow">Sản phẩm dẫn đầu</p>
          <h2 id="products-heading">Top 5 theo số lượng</h2>
        </div>
        <p>Xếp hạng theo số sản phẩm thuộc đơn đã hoàn tất.</p>
      </div>

      <div className="adm-table-scroll">
        <table className="adm-products-table">
          <thead>
            <tr>
              <th scope="col">Hạng</th>
              <th scope="col">Sản phẩm</th>
              <th scope="col">Số lượng</th>
              <th scope="col">Doanh số</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.sku}>
                <td className="adm-products-table__rank">
                  {String(product.rank).padStart(2, "0")}
                </td>
                <th scope="row">
                  <strong>{product.name}</strong>
                  <span>{product.sku}</span>
                </th>
                <td>
                  <strong>{formatCount(product.quantity)}</strong>
                  <span className="adm-products-table__bar" aria-hidden="true">
                    <i
                      style={{
                        transform: `scaleX(${product.quantity / maximumQuantity})`,
                      }}
                    />
                  </span>
                </td>
                <td>{formatCurrency(product.completedSales)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
