import { cleanup, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { POLICY_PAGES } from "~/components/storefront/storefront-content";
import { ErrorBoundary, loader } from "~/routes/policies.$slug";

function load(slug: string) {
  return loader({
    request: new Request(`http://localhost/policies/${slug}`),
    params: { slug },
    context: {},
  } as never);
}

afterEach(cleanup);

describe("policy route", () => {
  it("returns the policy that matches the slug", () => {
    const result = load("doi-tra");

    expect(result.policy).toEqual({ slug: "doi-tra", title: "Chính sách đổi trả" });
    expect(result.index).toBe(1);
  });

  it("throws a 404 response for an unknown slug", () => {
    let thrown: unknown;
    try {
      load("khong-ton-tai");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ init: { status: 404 } });
  });

  it("renders a not-found page that links to every policy", () => {
    const router = createMemoryRouter([{ path: "*", element: <ErrorBoundary /> }]);
    render(<RouterProvider router={router} />);

    expect(screen.getByRole("heading", { name: "Không tìm thấy chính sách" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Chính sách khác" });
    expect(within(nav).getAllByRole("link")).toHaveLength(POLICY_PAGES.length);
  });
});
