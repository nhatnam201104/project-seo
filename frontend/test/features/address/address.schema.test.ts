import { describe, expect, it } from "vitest";
import { addressFormSchema } from "~/features/address/validation/address.schema";

const valid = {
  receiver_name: "Nguyễn Nhật Nam",
  receiver_phone: "0901234567",
  line: "12 Nguyễn Huệ",
  city: "Thành phố Hồ Chí Minh",
  district: "Quận 1",
  ward: "Phường Bến Nghé",
  is_default: true,
};

describe("addressFormSchema", () => {
  it("chấp nhận địa chỉ đầy đủ", () => expect(addressFormSchema.safeParse(valid).success).toBe(true));
  it("yêu cầu chọn đủ tỉnh / quận / phường", () => {
    const r = addressFormSchema.safeParse({ ...valid, city: "", district: "", ward: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(["city", "district", "ward"]);
  });
  it("từ chối số điện thoại không hợp lệ", () => {
    expect(addressFormSchema.safeParse({ ...valid, receiver_phone: "12345" }).success).toBe(false);
  });
});
