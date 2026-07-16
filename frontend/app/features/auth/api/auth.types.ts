import type { Id, RoleCode } from "~/core/domain/enums";

/**
 * Types cho Auth. LƯU Ý quy ước đặt tên KHÔNG đồng nhất của backend:
 *  - BODY request/response = snake_case (theo api-list.html).
 *  - Query params ở nơi khác = camelCase.
 * Ta bám ĐÚNG contract, không tự đồng nhất hoá.
 */

// ---- Request bodies (snake_case) ----
export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
};

export type RefreshRequest = {
  refresh_token: string;
};

export type LogoutRequest = {
  refresh_token: string;
};

// ---- Response bodies (snake_case) ----
/** Người dùng như backend trả về ở /me và trong payload đăng nhập/đăng ký. */
export type AuthUser = {
  id?: Id;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: RoleCode;
  // /me KHÔNG trả `permissions` — hệ thống chỉ RBAC theo role (xem report §4).
};

/** POST /auth/login → { access_token, refresh_token }. */
export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user?: AuthUser;
};

/** POST /auth/register → user + tokens. */
export type RegisterResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

/** POST /auth/refresh → xoay cả access_token và refresh_token. */
export type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};
