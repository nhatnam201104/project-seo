/**
 * Contract đề xuất cho backend (sau base /api/v1) — CHƯA có controller tương ứng.
 * Mọi endpoint yêu cầu Bearer token.
 */
export const PROFILE_ENDPOINTS = {
  me: "/users/me", // GET hồ sơ, PUT cập nhật
  password: "/users/me/password", // POST { current_password, new_password }
  avatar: "/users/me/avatar", // POST multipart "file"
} as const;
