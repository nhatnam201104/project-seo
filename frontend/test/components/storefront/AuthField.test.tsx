import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AuthField } from "~/components/storefront/AuthField";

afterEach(cleanup);

describe("AuthField", () => {
  it("exposes validation errors accessibly", () => {
    render(<AuthField label="Email" name="email" type="email" error="Email không hợp lệ." />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Email không hợp lệ.");
  });

  it("toggles password visibility without replacing the shared field", async () => {
    const user = userEvent.setup();
    render(<AuthField label="Mật khẩu" name="password" type="password" />);
    const input = screen.getByLabelText("Mật khẩu");
    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(input).toHaveAttribute("type", "text");
  });
});
