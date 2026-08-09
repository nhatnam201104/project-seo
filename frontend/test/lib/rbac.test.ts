import { describe, expect, it } from "vitest";
import { hasRole, isAdmin } from "~/lib/rbac";
import { ROLE } from "~/core/domain/enums";

describe("hasRole", () => {
  it("returns true when the user role matches the required role", () => {
    // Arrange
    const userRole = ROLE.ADMIN;

    // Act
    const result = hasRole(userRole, ROLE.ADMIN);

    // Assert
    expect(result).toBe(true);
  });

  it("returns false when the user role does not match", () => {
    expect(hasRole(ROLE.USER, ROLE.ADMIN)).toBe(false);
  });

  it("returns false when the user role is null or undefined", () => {
    expect(hasRole(null, ROLE.USER)).toBe(false);
    expect(hasRole(undefined, ROLE.USER)).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true only for the ADMIN role", () => {
    expect(isAdmin(ROLE.ADMIN)).toBe(true);
    expect(isAdmin(ROLE.USER)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});
