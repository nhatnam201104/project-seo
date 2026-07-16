import { ROLE, type RoleCode } from "~/core/domain/enums";

/**
 * RBAC theo ROLE (USER / ADMIN) — ĐÚNG với backend hiện tại.
 *
 * ⚠️ Hệ thống KHÔNG có bảng permission và /me KHÔNG trả `permissions`
 * (xem report §4). Vì vậy KHÔNG có `hasPermission(...)`. Nếu sau này backend
 * bổ sung permission chi tiết, mở rộng ở đây kèm cập nhật contract /me.
 *
 * Mọi kiểm tra ở client chỉ để cải thiện UX — backend LUÔN kiểm tra lại.
 */
export function hasRole(
  userRole: RoleCode | null | undefined,
  required: RoleCode,
): boolean {
  return userRole === required;
}

export function isAdmin(userRole: RoleCode | null | undefined): boolean {
  return hasRole(userRole, ROLE.ADMIN);
}
