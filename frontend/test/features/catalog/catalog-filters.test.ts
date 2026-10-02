import { describe, expect, it } from "vitest";
import { colorCss, normalizeSort } from "~/features/catalog/catalog-filters";
import { parseProductQuery } from "~/features/catalog/services/product.service";

describe("normalizeSort", () => {
  it("giữ sort hợp lệ", () => expect(normalizeSort("minPrice,asc")).toBe("minPrice,asc"));
  it("quy alias cũ và giá trị lạ về mới nhất", () => {
    expect(normalizeSort("new")).toBe("createdAt,desc");
    expect(normalizeSort(null)).toBe("createdAt,desc");
    expect(normalizeSort("name;drop")).toBe("createdAt,desc");
  });
});

describe("colorCss", () => {
  it("tra màu theo tên (không phân biệt hoa thường) và có màu dự phòng", () => {
    expect(colorCss("Black")).toBe("#111111");
    expect(colorCss("Unknown")).toBe("#cfc4c5");
    expect(colorCss(null)).toBe("#cfc4c5");
  });
});

describe("parseProductQuery", () => {
  it("đọc bộ lọc từ URL", () => {
    const q = parseProductQuery(new URL("http://x/products?minPrice=100&hasLens=true&gender=nam&page=2"));
    expect(q).toMatchObject({ minPrice: 100, hasLens: true, gender: "nam", page: 2, size: 12 });
  });
});
