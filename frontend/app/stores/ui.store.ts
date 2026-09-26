import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeLocalStorage } from "./safe-storage";

export type ThemePreference = "light" | "dark" | "system";

/**
 * UI store — preference hiển thị. Persist `theme` + `sidebarCollapsed` (an toàn,
 * không nhạy cảm). `mobileMenuOpen` là state phiên, KHÔNG persist.
 */
type UiState = {
  theme: ThemePreference;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  setTheme: (theme: ThemePreference) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
    }),
    {
      name: "ps-ui",
      storage: createJSONStorage(safeLocalStorage),
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
