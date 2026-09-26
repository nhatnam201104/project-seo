import { useCallback, useEffect, useState } from "react";
import type { AdminTheme } from "../lib/admin-dashboard.types";

export const ADMIN_THEME_STORAGE_KEY = "projectsale-admin-theme";
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

export function resolveAdminTheme(
  storedTheme: string | null,
  prefersDark: boolean,
): AdminTheme {
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return prefersDark ? "dark" : "light";
}

export interface AdminThemeState {
  readonly theme: AdminTheme;
  readonly toggleTheme: () => void;
}

export function useAdminTheme(): AdminThemeState {
  const [theme, setTheme] = useState<AdminTheme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    const prefersDark =
      typeof window.matchMedia === "function"
        ? window.matchMedia(DARK_THEME_QUERY).matches
        : false;
    setTheme(resolveAdminTheme(storedTheme, prefersDark));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
