import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeLocalStorage } from "./safe-storage";

/**
 * Token giỏ hàng cho GUEST (header X-Cart-Token). Persist để giữ giỏ qua reload
 * khi chưa đăng nhập. Khi user đăng nhập, gọi /cart/merge rồi clear token này.
 *
 * TODO (R7): xác nhận với backend ai sinh X-Cart-Token và vòng đời của nó.
 */
type CartTokenState = {
  cartToken: string | null;
  setCartToken: (token: string) => void;
  clearCartToken: () => void;
};

export const useCartTokenStore = create<CartTokenState>()(
  persist(
    (set) => ({
      cartToken: null,
      setCartToken: (cartToken) => set({ cartToken }),
      clearCartToken: () => set({ cartToken: null }),
    }),
    {
      name: "ps-cart-token",
      storage: createJSONStorage(safeLocalStorage),
    },
  ),
);
