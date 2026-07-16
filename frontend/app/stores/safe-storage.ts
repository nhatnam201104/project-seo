import { type StateStorage } from "zustand/middleware";

/**
 * Storage an toàn cho SSR: trên server (không có `window`) trả về no-op để
 * tránh lỗi hydration / ReferenceError. Trên client dùng localStorage thật.
 */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export function safeLocalStorage(): StateStorage {
  if (typeof window === "undefined") return noopStorage;
  return window.localStorage;
}
