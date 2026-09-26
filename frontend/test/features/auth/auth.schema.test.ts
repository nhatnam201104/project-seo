import { describe, expect, it } from "vitest";
import { loginRequestSchema, registerFormSchema, registerRequestSchema, verifyRequestSchema } from "~/features/auth/validation/auth.schema";

const registration = { full_name: " Nguyễn Văn Nam ", email: "nam@example.com", phone: "0901234567", password: "password123" };
describe("auth validation matching backend DTOs", () => {
  it("trims names but preserves password whitespace and strips UI-only fields", () => {
    expect(registerRequestSchema.parse({ ...registration, password: " password123 ", terms: true })).toEqual({
      ...registration, full_name: "Nguyễn Văn Nam", password: " password123 ",
    });
  });
  it.each(["", "0123456789", "123", "+849012345678", "090 123 4567"])("rejects invalid required phone %s", (phone) => {
    expect(registerRequestSchema.safeParse({ ...registration, phone }).success).toBe(false);
  });
  it.each(["0901234567", "+84901234567"])("accepts supported Vietnamese phone %s", (phone) => {
    expect(registerRequestSchema.safeParse({ ...registration, phone }).success).toBe(true);
  });
  it("enforces backend field limits, terms and confirmation", () => {
    for (const invalid of [{ full_name: "x".repeat(121) }, { email: `${"a".repeat(180)}@example.com` }, { password: "a".repeat(73) }, { password: "        " }]) {
      expect(registerRequestSchema.safeParse({ ...registration, ...invalid }).success).toBe(false);
    }
    expect(registerFormSchema.safeParse({ ...registration, confirm_password: "different", terms: false }).success).toBe(false);
  });
  it("requires UUID devices and six OTP digits, retaining leading zeros", () => {
    expect(loginRequestSchema.safeParse({ email: registration.email, password: "x" }).success).toBe(false);
    const body = { email: registration.email, deviceId: "f9f72790-5713-4f56-a931-99c08b747f5f", otp: "001234" };
    expect(verifyRequestSchema.parse(body).otp).toBe("001234");
    expect(verifyRequestSchema.safeParse({ ...body, otp: "abcdef" }).success).toBe(false);
  });
});
