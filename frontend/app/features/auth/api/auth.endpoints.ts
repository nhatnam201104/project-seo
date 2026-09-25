/** Contract: backend AuthController, relative to /api/v1. All use POST. */
export const AUTH_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  verify: "/auth/verify",
  resendOtp: "/auth/resendOTP",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
} as const;
