import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  formatVnDate,
  parseVnDate,
  updateProfileSchema,
  validateAvatar,
} from "~/features/profile/validation/profile.schema";

describe("parseVnDate", () => {
  it("chuyển DD/MM/YYYY sang ISO", () => expect(parseVnDate("24/10/1995")).toBe("1995-10-24"));
  it("chuỗi rỗng là null", () => expect(parseVnDate("  ")).toBeNull());
  it("từ chối ngày không tồn tại hoặc ở tương lai", () => {
    expect(parseVnDate("31/02/2000")).toBeUndefined();
    expect(parseVnDate("01/01/2999")).toBeUndefined();
    expect(parseVnDate("1995-10-24")).toBeUndefined();
  });
  it("formatVnDate là nghịch đảo", () => expect(formatVnDate("1995-10-24")).toBe("24/10/1995"));
});

describe("updateProfileSchema", () => {
  const base = { full_name: " Nam Nguyen ", phone: "0901234567", date_of_birth: "24/10/1995", gender: "MALE" };
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

describe("changePasswordSchema (tối thiểu 6 ký tự)", () => {
  const ok = { current_password: "old", new_password: "abc123", confirm_password: "abc123" };
  it("chấp nhận đúng 6 ký tự có chữ thường và số", () => expect(changePasswordSchema.safeParse(ok).success).toBe(true));
  it("từ chối 5 ký tự", () => {
    const r = changePasswordSchema.safeParse({ ...ok, new_password: "abc12", confirm_password: "abc12" });
    expect(r.success).toBe(false);
  });
  it("từ chối khi thiếu chữ số", () => {
    expect(changePasswordSchema.safeParse({ ...ok, new_password: "abcdef", confirm_password: "abcdef" }).success).toBe(false);
  });
  it("báo lỗi xác nhận không khớp ở trường confirm_password", () => {
    const r = changePasswordSchema.safeParse({ ...ok, confirm_password: "other1" });
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
