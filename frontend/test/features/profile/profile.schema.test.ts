import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  parseIsoDate,
  updateProfileSchema,
  validateAvatar,
} from "~/features/profile/validation/profile.schema";

describe("parseIsoDate", () => {
  it("nhận YYYY-MM-DD hợp lệ", () => expect(parseIsoDate("1995-10-24")).toBe("1995-10-24"));
  it("chuỗi rỗng là null", () => expect(parseIsoDate("  ")).toBeNull());
  it("từ chối ngày không tồn tại, tương lai hoặc sai định dạng", () => {
    expect(parseIsoDate("2000-02-31")).toBeUndefined();
    expect(parseIsoDate("2999-01-01")).toBeUndefined();
    expect(parseIsoDate("24/10/1995")).toBeUndefined();
    expect(parseIsoDate("1899-12-31")).toBeUndefined();
  });
});

describe("updateProfileSchema", () => {
  const base = { full_name: " Nam Nguyen ", phone: "0901234567", date_of_birth: "1995-10-24", gender: "MALE" };
  it("chuẩn hóa dữ liệu hợp lệ", () => {
    const r = updateProfileSchema.parse(base);
    expect(r).toEqual({ full_name: "Nam Nguyen", phone: "0901234567", date_of_birth: "1995-10-24", gender: "MALE" });
  });
  it("cho phép bỏ trống số điện thoại và ngày sinh", () => {
    const r = updateProfileSchema.parse({ ...base, phone: "", date_of_birth: "", gender: null });
    expect(r.phone).toBeNull();
    expect(r.date_of_birth).toBeNull();
  });
  it("báo lỗi số điện thoại sai", () => {
    const r = updateProfileSchema.safeParse({ ...base, phone: "123" });
    expect(r.success).toBe(false);
  });
});

describe("changePasswordSchema (tối thiểu 8 ký tự)", () => {
  const ok = { current_password: "old", new_password: "abcdef12", confirm_password: "abcdef12" };
  it("chấp nhận đúng 8 ký tự có chữ thường và số", () => expect(changePasswordSchema.safeParse(ok).success).toBe(true));
  it("từ chối 7 ký tự", () => {
    const r = changePasswordSchema.safeParse({ ...ok, new_password: "abcde12", confirm_password: "abcde12" });
    expect(r.success).toBe(false);
  });
  it("từ chối khi thiếu chữ số", () => {
    expect(changePasswordSchema.safeParse({ ...ok, new_password: "abcdefgh", confirm_password: "abcdefgh" }).success).toBe(false);
  });
  it("báo lỗi xác nhận không khớp ở trường confirm_password", () => {
    const r = changePasswordSchema.safeParse({ ...ok, confirm_password: "other123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(["confirm_password"]);
  });
});

describe("validateAvatar", () => {
  const file = (type: string, size: number) => new File([new Uint8Array(size)], "a", { type });
  it("nhận png ≤ 2MB", () => expect(validateAvatar(file("image/png", 10))).toBeNull());
  it("từ chối sai loại và quá lớn", () => {
    expect(validateAvatar(file("image/gif", 10))).not.toBeNull();
    expect(validateAvatar(file("image/png", 3 * 1024 * 1024))).not.toBeNull();
  });
});
