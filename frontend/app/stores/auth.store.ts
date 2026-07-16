import { create } from "zustand";
import { ROLE, type RoleCode } from "~/core/domain/enums";
import type { AuthUser } from "~/features/auth/api/auth.types";

/**
 * Auth store — chỉ HIỂN THỊ (điều hướng, ẩn/hiện UI theo role).
 *
 * KHÔNG persist: nguồn xác thực là session cookie httpOnly ở server. Store này
 * được nạp từ loader data (root) mỗi lần tải, không phải nguồn tin cậy.
 * KHÔNG chứa access/refresh token — token nằm ở server, JS không thấy.
 */
type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  hasRole: (role: RoleCode) => boolean;
  isAdmin: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: user != null }),

  clearAuth: () => set({ user: null, isAuthenticated: false }),

  hasRole: (role) => get().user?.role === role,

  isAdmin: () => get().user?.role === ROLE.ADMIN,
}));
