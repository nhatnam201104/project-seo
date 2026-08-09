import type {
  DashboardData,
  DashboardDataByPeriod,
  OrderStatusDatum,
  TopProductDatum,
  TrendPoint,
} from "../lib/admin-dashboard.types";

function freezeList<T>(items: ReadonlyArray<T>): ReadonlyArray<T> {
  return Object.freeze(items.map((item) => Object.freeze(item)));
}

function freezeDashboard(data: DashboardData): DashboardData {
  return Object.freeze({
    ...data,
    metrics: Object.freeze({
      completedSales: Object.freeze(data.metrics.completedSales),
      ordersCreated: Object.freeze(data.metrics.ordersCreated),
      averageOrderValue: Object.freeze(data.metrics.averageOrderValue),
      newCustomers: Object.freeze(data.metrics.newCustomers),
    }),
    operations: Object.freeze(data.operations),
    trend: freezeList<TrendPoint>(data.trend),
    orderStatuses: freezeList<OrderStatusDatum>(data.orderStatuses),
    topProducts: freezeList<TopProductDatum>(data.topProducts),
  });
}

const weekData = freezeDashboard({
  periodLabel: "04–10 tháng 8, 2026",
  comparisonLabel: "so với 28 tháng 7–03 tháng 8",
  metrics: {
    completedSales: {
      value: 486_400_000,
      changePercentage: 12.4,
      previousLabel: "Tuần trước",
    },
    ordersCreated: {
      value: 348,
      changePercentage: 8.7,
      previousLabel: "Tuần trước",
    },
    averageOrderValue: {
      value: 1_520_000,
      changePercentage: 3.1,
      previousLabel: "Tuần trước",
    },
    newCustomers: {
      value: 96,
      changePercentage: -2.4,
      previousLabel: "Tuần trước",
    },
  },
  trend: [
    { label: "T2 · 04/08", completedSales: 58_400_000, ordersCreated: 41 },
    { label: "T3 · 05/08", completedSales: 64_200_000, ordersCreated: 46 },
    { label: "T4 · 06/08", completedSales: 61_800_000, ordersCreated: 43 },
    { label: "T5 · 07/08", completedSales: 72_500_000, ordersCreated: 54 },
    { label: "T6 · 08/08", completedSales: 79_600_000, ordersCreated: 59 },
    { label: "T7 · 09/08", completedSales: 83_200_000, ordersCreated: 62 },
    { label: "CN · 10/08", completedSales: 66_700_000, ordersCreated: 43 },
  ],
  operations: {
    pendingOrders: 24,
    lowStockVariants: 11,
    pendingReviews: 17,
  },
  orderStatuses: [
    { status: "PENDING", label: "Chờ xác nhận", count: 54 },
    { status: "CONFIRMED", label: "Đã xác nhận", count: 67 },
    { status: "SHIPPING", label: "Đang giao", count: 58 },
    { status: "COMPLETED", label: "Hoàn tất", count: 142 },
    { status: "CANCELLED", label: "Đã hủy", count: 19 },
    { status: "REFUNDED", label: "Hoàn tiền", count: 8 },
  ],
  topProducts: [
    { rank: 1, name: "MORAINE Core 01", sku: "MOR-C01-BLK", quantity: 48, completedSales: 67_200_000 },
    { rank: 2, name: "VISOR Titanium V2", sku: "VSR-TI02-SLV", quantity: 39, completedSales: 62_400_000 },
    { rank: 3, name: "MORAINE Air 03", sku: "MOR-A03-AMB", quantity: 35, completedSales: 49_000_000 },
    { rank: 4, name: "VISOR Archive 01", sku: "VSR-A01-GRN", quantity: 29, completedSales: 43_500_000 },
    { rank: 5, name: "MORAINE Studio 02", sku: "MOR-S02-CLR", quantity: 24, completedSales: 33_600_000 },
  ],
});

const monthTrendValues: ReadonlyArray<readonly [number, number]> = [
  [48, 36], [52, 38], [59, 42], [54, 39], [68, 49], [73, 53], [61, 44],
  [57, 41], [64, 46], [69, 50], [71, 51], [76, 55], [82, 59], [63, 45],
  [60, 43], [66, 47], [72, 52], [75, 54], [79, 57], [85, 61], [67, 48],
  [62, 44], [70, 50], [74, 53], [81, 58], [88, 63], [92, 66], [72, 51],
  [69, 49], [79, 55],
];

const monthData = freezeDashboard({
  periodLabel: "Tháng 8, 2026",
  comparisonLabel: "so với tháng 7, 2026",
  metrics: {
    completedSales: {
      value: 2_088_000_000,
      changePercentage: 9.8,
      previousLabel: "Tháng trước",
    },
    ordersCreated: {
      value: 1_458,
      changePercentage: 7.2,
      previousLabel: "Tháng trước",
    },
    averageOrderValue: {
      value: 1_610_000,
      changePercentage: 4.3,
      previousLabel: "Tháng trước",
    },
    newCustomers: {
      value: 414,
      changePercentage: 11.6,
      previousLabel: "Tháng trước",
    },
  },
  trend: monthTrendValues.map(([salesInMillions, orders], index) => ({
    label: `${String(index + 1).padStart(2, "0")}/08`,
    completedSales: salesInMillions * 1_000_000,
    ordersCreated: orders,
  })),
  operations: {
    pendingOrders: 24,
    lowStockVariants: 11,
    pendingReviews: 17,
  },
  orderStatuses: [
    { status: "PENDING", label: "Chờ xác nhận", count: 218 },
    { status: "CONFIRMED", label: "Đã xác nhận", count: 279 },
    { status: "SHIPPING", label: "Đang giao", count: 242 },
    { status: "COMPLETED", label: "Hoàn tất", count: 608 },
    { status: "CANCELLED", label: "Đã hủy", count: 78 },
    { status: "REFUNDED", label: "Hoàn tiền", count: 33 },
  ],
  topProducts: [
    { rank: 1, name: "MORAINE Core 01", sku: "MOR-C01-BLK", quantity: 186, completedSales: 260_400_000 },
    { rank: 2, name: "VISOR Titanium V2", sku: "VSR-TI02-SLV", quantity: 158, completedSales: 252_800_000 },
    { rank: 3, name: "MORAINE Air 03", sku: "MOR-A03-AMB", quantity: 141, completedSales: 197_400_000 },
    { rank: 4, name: "VISOR Archive 01", sku: "VSR-A01-GRN", quantity: 119, completedSales: 178_500_000 },
    { rank: 5, name: "MORAINE Studio 02", sku: "MOR-S02-CLR", quantity: 98, completedSales: 137_200_000 },
  ],
});

export const DASHBOARD_MOCK_DATA: DashboardDataByPeriod = Object.freeze({
  WEEK: weekData,
  MONTH: monthData,
});
