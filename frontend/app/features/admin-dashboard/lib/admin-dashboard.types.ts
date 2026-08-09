export type DashboardPeriod = "WEEK" | "MONTH";
export type TrendMetric = "SALES" | "ORDERS";
export type AdminTheme = "light" | "dark";

export type OrderStatus =
  "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED" | "REFUNDED";

export interface MetricValue {
  readonly value: number;
  readonly changePercentage: number;
  readonly previousLabel: string;
}

export interface TrendPoint {
  readonly label: string;
  readonly completedSales: number;
  readonly ordersCreated: number;
}

export interface DashboardOperations {
  readonly pendingOrders: number;
  readonly lowStockVariants: number;
  readonly pendingReviews: number;
}

export interface OrderStatusDatum {
  readonly status: OrderStatus;
  readonly label: string;
  readonly count: number;
}

export interface TopProductDatum {
  readonly rank: number;
  readonly name: string;
  readonly sku: string;
  readonly quantity: number;
  readonly completedSales: number;
}

export interface DashboardData {
  readonly periodLabel: string;
  readonly comparisonLabel: string;
  readonly metrics: {
    readonly completedSales: MetricValue;
    readonly ordersCreated: MetricValue;
    readonly averageOrderValue: MetricValue;
    readonly newCustomers: MetricValue;
  };
  readonly trend: ReadonlyArray<TrendPoint>;
  readonly operations: DashboardOperations;
  readonly orderStatuses: ReadonlyArray<OrderStatusDatum>;
  readonly topProducts: ReadonlyArray<TopProductDatum>;
}

export type DashboardDataByPeriod = Readonly<
  Record<DashboardPeriod, DashboardData>
>;

export interface AdminDashboardDataSource {
  getDashboard(period: DashboardPeriod): Promise<DashboardData>;
}
