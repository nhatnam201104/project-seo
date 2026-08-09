import { describe, expect, it } from "vitest";
import { toSlug } from "~/features/admin-shared/lib/slug";

describe("toSlug", () => {
  it("normalizes Vietnamese text and the đ character", () => {
    expect(toSlug("Đồng hồ & Kính Cận Mới")).toBe("dong-ho-kinh-can-moi");
  });

  it("collapses separators and trims leading or trailing dashes", () => {
    expect(toSlug("  MORAINE -- Core 01!!!  ")).toBe("moraine-core-01");
  });

  it("returns an empty preview when the title is empty", () => {
    expect(toSlug("   ")).toBe("");
  });
});
