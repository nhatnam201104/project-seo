import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShowcaseSection } from "~/components/landing/ShowcaseSection";

const gsapMocks = vi.hoisted(() => ({
  fromTo: vi.fn(),
  killTweensOf: vi.fn(),
  quickTo: vi.fn(() => Object.assign(vi.fn(), { tween: { kill: vi.fn() } })),
  to: vi.fn(),
}));

vi.mock("gsap", () => ({
  gsap: gsapMocks,
}));

vi.mock("~/hooks/useGsapContext", () => ({
  useGsapContext: vi.fn(),
}));

function renderShowcase() {
  const view = render(
    <MemoryRouter>
      <ShowcaseSection />
    </MemoryRouter>,
  );
  const list = view.container.querySelector(".lp-showcase-list");
  const acetateLink = screen.getByRole("link", { name: /Gọng Acetate 01/ });

  expect(list).not.toBeNull();
  return { ...view, acetateLink, list: list! };
}

describe("ShowcaseSection preview controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    gsapMocks.fromTo.mockClear();
    gsapMocks.killTweensOf.mockClear();
    gsapMocks.quickTo.mockClear();
    gsapMocks.to.mockClear();

    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        media: "(hover: hover) and (pointer: fine)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("restores the hovered preview after scrolling settles on an Index row", () => {
    const { acetateLink } = renderShowcase();
    vi.spyOn(acetateLink, "matches").mockImplementation(
      (selector) => selector === ":hover",
    );

    fireEvent.mouseEnter(acetateLink);
    fireEvent.scroll(window);

    expect(gsapMocks.to).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ autoAlpha: 0, overwrite: "auto" }),
    );

    act(() => vi.advanceTimersByTime(100));

    expect(gsapMocks.to).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ autoAlpha: 1, overwrite: "auto" }),
    );
  });

  it("keeps the preview hidden after scroll idle when the row is no longer hovered", () => {
    const { acetateLink } = renderShowcase();
    vi.spyOn(acetateLink, "matches").mockReturnValue(false);

    fireEvent.mouseEnter(acetateLink);
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(100));

    expect(gsapMocks.to).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ autoAlpha: 0, overwrite: "auto" }),
    );
  });

  it("hides the preview when the pointer leaves the whole Index list", () => {
    const { acetateLink, list } = renderShowcase();

    fireEvent.mouseEnter(acetateLink);
    fireEvent.mouseLeave(list);

    expect(gsapMocks.to).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ autoAlpha: 0 }),
    );
  });

  it("does not restore a keyboard-focused preview after scrolling", () => {
    const { acetateLink } = renderShowcase();
    vi.spyOn(acetateLink, "matches").mockReturnValue(false);

    fireEvent.focus(acetateLink);
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(100));

    expect(gsapMocks.to).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ autoAlpha: 0 }),
    );
  });

  it("switches rapidly to the latest product without stale tweens", () => {
    const { container } = renderShowcase();
    const titaniumLink = screen.getByRole("link", { name: /Gọng Titanium 02/ });

    fireEvent.mouseEnter(screen.getByRole("link", { name: /Gọng Acetate 01/ }));
    fireEvent.mouseEnter(titaniumLink);

    expect(container.querySelector(".lp-showcase-preview img")).toHaveAttribute(
      "src",
      "/landing/panel-boot-800.webp",
    );
    expect(gsapMocks.to).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ overwrite: "auto" }),
    );
  });

  it("cleans the scroll-idle timer and GSAP tweens on unmount", () => {
    const { acetateLink, unmount } = renderShowcase();

    fireEvent.mouseEnter(acetateLink);
    fireEvent.scroll(window);
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(gsapMocks.killTweensOf).toHaveBeenCalled();
  });
});
