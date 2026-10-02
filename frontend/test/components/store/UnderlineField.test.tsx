import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UnderlineField, UnderlineSelect } from "~/components/store/UnderlineField";

afterEach(cleanup);

describe("UnderlineField", () => {
  it("gắn nhãn, đánh dấu bắt buộc và thông báo lỗi", () => {
    render(<UnderlineField label="Họ và tên" name="full_name" required error="Vui lòng nhập họ và tên." />);
    const input = screen.getByLabelText("Họ và tên *");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng nhập họ và tên.");
  });
  it("ẩn/hiện mật khẩu", async () => {
    render(<UnderlineField label="Mật khẩu" name="pw" type="password" />);
    const input = screen.getByLabelText("Mật khẩu");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(input).toHaveAttribute("type", "text");
  });
});

describe("UnderlineSelect", () => {
  it("giữ giá trị đã chọn dù danh sách chưa tải và gọi onChange", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <UnderlineSelect label="Quận / Huyện" name="district" value="Quận 1" onChange={onChange} options={[]} placeholder="Chọn quận / huyện" />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Quận 1");
    rerender(<UnderlineSelect label="Quận / Huyện" name="district" value="" onChange={onChange} options={[{ value: "Quận 3", label: "Quận 3" }]} placeholder="Chọn quận / huyện" />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "Quận 3");
    expect(onChange).toHaveBeenCalledWith("Quận 3");
  });
  it("vô hiệu hóa khi chưa chọn cấp trên", () => {
    render(<UnderlineSelect label="Phường / Xã" name="ward" value="" onChange={() => {}} options={[]} placeholder="Chọn phường / xã" disabled hint="Chọn quận / huyện trước" />);
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByText("Chọn quận / huyện trước")).toBeInTheDocument();
  });
});
