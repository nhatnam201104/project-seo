// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.API_BASE_URL = "http://localhost:8081/api/v1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters";
});

const api = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  deleteAddress: vi.fn(),
  makeDefaultAddress: vi.fn(),
  updateAddress: vi.fn(),
  createAddress: vi.fn(),
  listAddresses: vi.fn(),
}));
vi.mock("~/lib/auth.server", () => ({
  requireUser: vi.fn(async () => ({ client: {}, user: { id: "u1" }, commit: async () => null })),
}));
vi.mock("~/features/profile/api/profile.api", () => api);
vi.mock("~/features/address/api/address.api", () => api);

import { action as profileAction } from "~/routes/account.profile";
import { action as addressesAction } from "~/routes/account.addresses";
import { loader as accountLoader } from "~/routes/account";
import { submitAddress } from "~/features/address/services/address-action.server";

function post(fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return new Request("http://localhost/x", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}
const run = (fn: unknown, fields: Record<string, string>) =>
  (fn as (a: unknown) => Promise<{ data?: unknown; init?: { status?: number } } & Response>)({
    request: post(fields), params: {}, context: {},
  });

beforeEach(() => vi.clearAllMocks());

describe("account.profile action", () => {
  it("sends snake_case payload with null for empty optional fields", async () => {
    api.updateProfile.mockResolvedValue({});
    await run(profileAction, { intent: "profile", full_name: " An ", phone: "", date_of_birth: "", gender: "" });
    expect(api.updateProfile).toHaveBeenCalledWith(expect.anything(), { full_name: "An", phone: null, date_of_birth: null, gender: null }, expect.anything());
  });

  it("maps 409 duplicate phone onto the phone field", async () => {
    api.updateProfile.mockRejectedValue({ status: 409, message: "Phone number already exists" });
    const res = (await run(profileAction, { intent: "profile", full_name: "An", phone: "0912345678", date_of_birth: "", gender: "" })) as never as { data: { fieldErrors: Record<string, string> }; init: { status: number } };
    expect(res.init.status).toBe(409);
    expect(res.data.fieldErrors.phone).toBe("Phone number already exists");
  });

  it("shows the wrong-current-password message as a banner error (400)", async () => {
    api.changePassword.mockRejectedValue({ status: 400, message: "Mật khẩu hiện tại không đúng" });
    const res = (await run(profileAction, { intent: "password", current_password: "x", new_password: "abcdefg1", confirm_password: "abcdefg1" })) as never as { data: { error: string } };
    expect(res.data.error).toBe("Mật khẩu hiện tại không đúng");
  });
});

describe("address actions against a real backend (endpoint exists)", () => {
  it("does not claim the feature is unsupported when an address is gone (ADDRESS_NOT_FOUND 404)", async () => {
    api.deleteAddress.mockRejectedValue({ status: 404, message: "Không tìm thấy địa chỉ" });
    const res = (await run(addressesAction, { intent: "delete", id: "a1" })) as never as { data: { error: string } };
    // Backend now exists, so a 404 means "address not found", not "Chức năng này chưa được máy chủ hỗ trợ".
    expect(res.data.error).toBe("Không tìm thấy địa chỉ");
  });

  it("create address: 404 from backend is surfaced as not-found rather than unsupported", async () => {
    api.updateAddress.mockRejectedValue({ status: 404, message: "Không tìm thấy địa chỉ" });
    const req = post({ receiver_name: "An", receiver_phone: "0912345678", line: "l", city: "c", district: "d", ward: "w" });
    const res = (await submitAddress(req, { client: {}, commit: async () => null } as never, "a1")) as never as { data: { error: string } };
    expect(res.data.error).toBe("Không tìm thấy địa chỉ");
  });
});

describe("success notices", () => {
  const redirectTo = (res: unknown) => (res as Response).headers.get("Location");
  it("profile accepts the ISO date from input[type=date]", async () => {
    api.updateProfile.mockResolvedValue({});
    await run(profileAction, { intent: "profile", full_name: "An", phone: "", date_of_birth: "1995-10-24", gender: "" });
    expect(api.updateProfile).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ date_of_birth: "1995-10-24" }), expect.anything());
  });
  it("redirects with notice codes after create/update/delete/default", async () => {
    const fields = { receiver_name: "An", receiver_phone: "0912345678", line: "l", city: "c", district: "d", ward: "w" };
    api.createAddress.mockResolvedValue({});
    api.updateAddress.mockResolvedValue({});
    api.deleteAddress.mockResolvedValue(undefined);
    api.makeDefaultAddress.mockResolvedValue(undefined);
    const auth = { client: {}, commit: async () => null } as never;
    expect(redirectTo(await submitAddress(post(fields), auth))).toBe("/account/addresses?notice=created");
    expect(redirectTo(await submitAddress(post(fields), auth, "a1"))).toBe("/account/addresses?notice=updated");
    expect(redirectTo(await run(addressesAction, { intent: "delete", id: "a1" }))).toBe("/account/addresses?notice=deleted");
    expect(redirectTo(await run(addressesAction, { intent: "default", id: "a1" }))).toBe("/account/addresses?notice=default");
  });
});

describe("account overview loader", () => {
  const load = async () => {
    const res = (await (accountLoader as unknown as (a: unknown) => Promise<{ data: { defaultAddress: { id: string } | null; addressCount: number } }>)({
      request: new Request("http://localhost/account"), params: {}, context: {},
    }));
    return res.data;
  };
  it("returns the default address and count", async () => {
    api.listAddresses.mockResolvedValue([{ id: "a", is_default: false }, { id: "b", is_default: true }]);
    expect(await load()).toMatchObject({ defaultAddress: { id: "b" }, addressCount: 2 });
  });
  it("falls back to the first address, or null when none", async () => {
    api.listAddresses.mockResolvedValue([{ id: "a", is_default: false }]);
    expect((await load()).defaultAddress?.id).toBe("a");
    api.listAddresses.mockResolvedValue([]);
    expect(await load()).toMatchObject({ defaultAddress: null, addressCount: 0 });
  });
});
