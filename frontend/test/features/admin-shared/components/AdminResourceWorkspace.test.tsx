import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AdminResourceWorkspace } from "~/features/admin-shared/components/AdminResourceWorkspace";
import { createMockAdminResourceService } from "~/features/admin-shared/services/mock-admin-resource.service";
import type { AdminResourceDefinition, AdminResourceRecord } from "~/features/admin-shared/lib/admin-resource.types";

afterEach(cleanup);

const definition: AdminResourceDefinition = {
  eyebrow: "Test", title: "Sản phẩm & kho", description: "Workspace test", entityLabel: "Sản phẩm",
  countLabel: "sản phẩm", searchPlaceholder: "Tìm sản phẩm", createLabel: "Thêm sản phẩm",
  columns: [{ key: "sku", label: "SKU" }],
  formFields: [{ key: "sku", label: "SKU", placeholder: "SKU-01" }],
  statuses: [
    { value: "ACTIVE", label: "Đang bán", tone: "positive" },
    { value: "INACTIVE", label: "Ngừng bán", tone: "neutral" },
  ],
};

const rows: ReadonlyArray<AdminResourceRecord> = [
  { id: "1", title: "MORAINE Core", subtitle: "RayBan", status: "ACTIVE", attributes: { sku: "MOR-01" }, updatedAt: "2026-08-09T00:00:00Z" },
  { id: "2", title: "VISOR Air", subtitle: "Bolon", status: "INACTIVE", attributes: { sku: "VSR-02" }, updatedAt: "2026-08-09T00:00:00Z" },
];

describe("AdminResourceWorkspace", () => {
  it("loads, filters and clears an empty result", async () => {
    const user = userEvent.setup();
    render(<AdminResourceWorkspace definition={definition} service={createMockAdminResourceService(rows)} />);
    expect(await screen.findByText("MORAINE Core")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Tìm sản phẩm"), "không tồn tại");
    expect(screen.getByText("Không tìm thấy Sản phẩm")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
    expect(screen.getByText("VISOR Air")).toBeInTheDocument();
  });

  it("creates a local prototype record through the drawer form", async () => {
    const user = userEvent.setup();
    render(<AdminResourceWorkspace definition={definition} service={createMockAdminResourceService(rows)} />);
    await screen.findByText("MORAINE Core");
    await user.click(screen.getByRole("button", { name: /Thêm sản phẩm/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Tên / tiêu đề"), "ATLAS Sun");
    await user.type(screen.getByLabelText("Thông tin phụ"), "Police");
    await user.type(screen.getByLabelText("SKU"), "ATL-07");
    await user.click(screen.getByRole("button", { name: "Tạo bản ghi" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("ATLAS Sun")).toBeInTheDocument();
  });

  it("limits status options when a workflow transition matrix is provided", async () => {
    const user = userEvent.setup();
    const governedDefinition: AdminResourceDefinition = {
      ...definition,
      allowedStatusValues: (record) => [record.status],
    };
    render(<AdminResourceWorkspace definition={governedDefinition} service={createMockAdminResourceService(rows)} />);
    await screen.findByText("MORAINE Core");
    await user.click(screen.getAllByRole("button", { name: "Mở" })[0]!);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("option", { name: "Đang bán" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("option", { name: "Ngừng bán" })).not.toBeInTheDocument();
  });

  it("generates a read-only Vietnamese slug from the title", async () => {
    const user = userEvent.setup();
    const slugDefinition: AdminResourceDefinition = {
      ...definition,
      formFields: [{ key: "slug", label: "Slug", placeholder: "slug" }],
    };
    const service = createMockAdminResourceService(rows);
    render(<AdminResourceWorkspace definition={slugDefinition} service={service} />);
    await screen.findByText("MORAINE Core");
    await user.click(screen.getByRole("button", { name: /Thêm sản phẩm/ }));
    await user.type(screen.getByLabelText("Tên / tiêu đề"), "Đồng Hồ Kính Cận");

    const slugInput = screen.getByLabelText("Slug");
    expect(slugInput).toHaveValue("dong-ho-kinh-can");
    expect(slugInput).toHaveAttribute("readonly");

    await user.type(screen.getByLabelText("Thông tin phụ"), "Bộ sưu tập mới");
    await user.click(screen.getByRole("button", { name: "Tạo bản ghi" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const created = (await service.list()).find((record) => record.title === "Đồng Hồ Kính Cận");
    expect(created?.attributes.slug).toBe("dong-ho-kinh-can");
  });
});
