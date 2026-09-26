const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const countFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

const compactMillionFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

const compactBillionFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value).replace(" ", " ");
}

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${compactBillionFormatter.format(value / 1_000_000_000)} tỷ ₫`;
  }

  return `${compactMillionFormatter.format(value / 1_000_000)} triệu ₫`;
}

export function formatDelta(changePercentage: number): string {
  if (changePercentage === 0) {
    return "Không đổi";
  }

  const direction = changePercentage > 0 ? "Tăng" : "Giảm";
  return `${direction} ${decimalFormatter.format(Math.abs(changePercentage))}%`;
}
