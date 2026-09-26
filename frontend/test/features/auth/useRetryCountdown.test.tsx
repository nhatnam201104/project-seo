import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useRetryCountdown } from "~/features/auth/hooks/useRetryCountdown";

afterEach(() => { cleanup(); vi.useRealTimers(); });

it("preserves resend cooldown after another action returns no retry deadline", () => {
  vi.useFakeTimers();
  const deadline = Date.now() + 300_000;
  const { result, rerender } = renderHook(({ retryAt }: { retryAt?: number }) => useRetryCountdown(retryAt), { initialProps: { retryAt: deadline } as { retryAt?: number } });
  expect(result.current).toBe(300);
  act(() => vi.advanceTimersByTime(10_000));
  rerender({ retryAt: undefined });
  expect(result.current).toBe(290);
  act(() => vi.advanceTimersByTime(290_000));
  expect(result.current).toBe(0);
});
