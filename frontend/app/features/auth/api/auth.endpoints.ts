/** Đường dẫn Auth (đứng sau base /api/v1). Nguồn: api-list.html §Auth. */
export const AUTH_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  google: "/auth/google",
  me: "/me",
} as const;
