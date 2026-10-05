// @vitest-environment node
import { describe, expect, it } from "vitest";

import { actionErrorMessage, isEndpointMissing } from "~/lib/action-error.server";

describe("action-error", () => {
  it("treats bare 404, 405 and 501 as a missing endpoint", () => {
    for (const status of [404, 405, 501]) {
      const error = { status, message: "Không tìm thấy tài nguyên.", bare: true };
      expect(isEndpointMissing(error)).toBe(true);
      expect(actionErrorMessage(error)).toEqual({ status: 503, message: expect.stringContaining("chưa được máy chủ hỗ trợ") });
    }
    expect(isEndpointMissing({ status: 405, message: "x" })).toBe(true);
  });

  it("passes through a 404 envelope with a server message", () => {
    const error = { status: 404, message: "Không tìm thấy người dùng" };
    expect(isEndpointMissing(error)).toBe(false);
    expect(actionErrorMessage(error)).toEqual({ status: 404, message: "Không tìm thấy người dùng" });
  });
});
