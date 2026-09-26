import { describe, expect, it } from "vitest";
import {
  formatCompactCurrency,
  formatCount,
  formatCurrency,
  formatDelta,
} from "~/features/admin-dashboard/lib/dashboard-format";

describe("dashboard formatters", () => {
  it("formats Vietnamese currency and counts deterministically", () => {
    expect(formatCurrency(486_400_000)).toBe("486.400.000 ₫");
    expect(formatCount(1_284)).toBe("1.284");
  });

  it("formats compact million and billion values", () => {
    expect(formatCompactCurrency(486_400_000)).toBe("486,4 triệu ₫");
    expect(formatCompactCurrency(2_088_000_000)).toBe("2,09 tỷ ₫");
  });

  it("describes positive, negative and neutral deltas without color-only meaning", () => {
    expect(formatDelta(12.4)).toBe("Tăng 12,4%");
    expect(formatDelta(-3.2)).toBe("Giảm 3,2%");
    expect(formatDelta(0)).toBe("Không đổi");
  });
});
