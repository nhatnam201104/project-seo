import { describe, expect, it } from "vitest";
import { formatDateTime, formatVnd } from "~/lib/format";

describe("formatVnd", () => {
  it("returns a dash for null, undefined or empty input", () => {
    expect(formatVnd(null)).toBe("—");
    expect(formatVnd(undefined)).toBe("—");
    expect(formatVnd("")).toBe("—");
  });

  it("returns a dash for non-numeric strings", () => {
    expect(formatVnd("abc")).toBe("—");
  });

  it("accepts numeric strings coming from a DECIMAL backend field", () => {
    expect(formatVnd("1350000")).toBe(formatVnd(1350000));
  });
});

describe("formatDateTime", () => {
  it("returns a dash for empty or invalid ISO input", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
  });

  it("formats a valid ISO-8601 string", () => {
    const result = formatDateTime("2026-07-09T10:22:00Z");

    expect(result).not.toBe("—");
    expect(result).toMatch(/2026/);
  });
});
