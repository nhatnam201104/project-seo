import { useEffect, useState } from "react";

const STORAGE_KEY = "projectsale-admin-sidebar";

export function useAdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setIsCollapsed(window.localStorage.getItem(STORAGE_KEY) === "collapsed");
    } catch {
      // Storage is optional in preview environments.
    }
  }, []);

  function toggleCollapsed() {
    setIsCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        // Keep the in-memory interaction working when storage is unavailable.
      }
      return next;
    });
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    openMobile: () => setIsMobileOpen(true),
    closeMobile: () => setIsMobileOpen(false),
  };
}
