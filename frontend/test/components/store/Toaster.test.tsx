import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster, TOAST_TIMEOUT_MS } from "~/components/store/Toaster";
import { useNotificationStore } from "~/stores/notification.store";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useNotificationStore.getState().clear();
});

describe("Toaster", () => {
  it("hiển thị thông báo và cho phép đóng", async () => {
    render(<Toaster />);
    act(() => useNotificationStore.getState().push("success", "Đã lưu hồ sơ"));
    expect(screen.getByRole("status")).toHaveTextContent("Đã lưu hồ sơ");
    await userEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByText("Đã lưu hồ sơ")).toBeNull();
  });
  it("tự ẩn sau thời gian chờ", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => useNotificationStore.getState().push("success", "Xong"));
    act(() => { vi.advanceTimersByTime(TOAST_TIMEOUT_MS + 10); });
    expect(screen.queryByText("Xong")).toBeNull();
  });
});
