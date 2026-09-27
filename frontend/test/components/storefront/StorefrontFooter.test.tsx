import { cleanup, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { StorefrontFooter } from "~/components/storefront/StorefrontFooter";
import {
  POLICY_PAGES,
  STORE_CATEGORIES,
  STORE_CONTACT,
} from "~/components/storefront/storefront-content";

function renderFooter() {
  const router = createMemoryRouter([{ path: "*", element: <StorefrontFooter /> }]);
  return render(<RouterProvider router={router} />);
}

afterEach(cleanup);

describe("StorefrontFooter", () => {
  it("renders the four footer columns with plain, unnumbered headings", () => {
    renderFooter();

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("sf-footer");
    const headings = within(footer).getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Giới thiệu",
      "Chính sách",
      "Danh mục",
      "Liên hệ",
    ]);
  });

  it("links every policy to its policy page", () => {
    renderFooter();

    const column = screen.getByRole("region", { name: /Chính sách/ });
    for (const policy of POLICY_PAGES) {
      expect(within(column).getByRole("link", { name: policy.title })).toHaveAttribute(
        "href",
        `/policies/${policy.slug}`,
      );
    }
  });

  it("links product categories to the filtered product list", () => {
    renderFooter();

    const column = screen.getByRole("region", { name: /Danh mục/ });
    const productGroups = STORE_CATEGORIES.filter((group) => group.slug);
    expect(productGroups).toHaveLength(3);
    for (const group of productGroups) {
      expect(within(column).getByRole("link", { name: group.title })).toHaveAttribute(
        "href",
        `/products?category=${group.slug}`,
      );
    }
  });

  it("exposes email, phone and store address as contact details", () => {
    renderFooter();

    const column = screen.getByRole("region", { name: /Liên hệ/ });
    expect(within(column).getByRole("link", { name: STORE_CONTACT.email })).toHaveAttribute(
      "href",
      `mailto:${STORE_CONTACT.email}`,
    );
    expect(within(column).getByRole("link", { name: STORE_CONTACT.phone.display })).toHaveAttribute(
      "href",
      `tel:${STORE_CONTACT.phone.tel}`,
    );
    const address = column.querySelector("address");
    expect(address).not.toBeNull();
    expect(address).toHaveTextContent(STORE_CONTACT.address);
  });

  it("does not render the oversized brand wordmark", () => {
    const { container } = renderFooter();

    expect(container.querySelector(".sf-footer__wordmark")).toBeNull();
    expect(screen.queryByText("PROJECTSALE")).toBeNull();
  });
});
