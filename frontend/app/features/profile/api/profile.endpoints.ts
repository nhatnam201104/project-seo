/**
 * Endpoint backend (sau base /api/v1), controller `UserController`.
 * Mọi endpoint yêu cầu Bearer token.
 */
export const PROFILE_ENDPOINTS = {
  me: "/users/me", // GET hồ sơ, PUT cập nhật
  password: "/users/me/password", // POST { current_password, new_password }
  avatar: "/users/me/avatar", // POST multipart "file" — backend CHƯA hỗ trợ (ngoài phạm vi issue #33)
} as const;
