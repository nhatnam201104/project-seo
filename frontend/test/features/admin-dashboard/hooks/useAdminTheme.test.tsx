import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_THEME_STORAGE_KEY,
  resolveAdminTheme,
  useAdminTheme,
} from "~/features/admin-dashboard/hooks/useAdminTheme";

function createMatchMedia(matches: boolean): typeof window.matchMedia {
  return (query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  });
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("admin theme", () => {
  it("resolves a stored preference before the system preference", () => {
    expect(resolveAdminTheme("light", true)).toBe("light");
    expect(resolveAdminTheme("dark", false)).toBe("dark");
    expect(resolveAdminTheme(null, true)).toBe("dark");
    expect(resolveAdminTheme("invalid", false)).toBe("light");
  });

  it("hydrates the preference and persists toggles", async () => {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, "dark");
    vi.stubGlobal("matchMedia", createMatchMedia(false));

    const { result } = renderHook(() => useAdminTheme());

    await waitFor(() => expect(result.current.theme).toBe("dark"));

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe("light");
    expect(window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe("light");
  });
});
