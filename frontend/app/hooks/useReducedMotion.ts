import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY).matches
    : false;
}

/** SSR trả về false; client theo dõi thay đổi trực tiếp từ media query. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Người dùng có bật "giảm chuyển động" ở hệ điều hành hay không.
 * Dùng để tắt Lenis/pin/scrub và thay bằng fade ngắn.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
