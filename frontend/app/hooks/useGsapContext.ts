import { useEffect, type DependencyList, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type GsapSetup = (context: gsap.Context) => void | (() => void);

/**
 * Chạy code GSAP trong `gsap.context` gắn với một scope DOM:
 * - selector trong callback chỉ match bên trong scope;
 * - mọi tween/ScrollTrigger tạo ra được revert sạch khi unmount
 *   (không leak, không trùng trigger khi StrictMode mount đôi);
 * - setup có thể trả về cleanup riêng (ví dụ matchMedia.revert).
 * Chỉ chạy phía client sau hydrate.
 */
export function useGsapContext(
  scopeRef: RefObject<HTMLElement | null>,
  setup: GsapSetup,
  deps: DependencyList = [],
): void {
  useEffect(() => {
    if (!scopeRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    let cleanup: void | (() => void);
    const context = gsap.context((self) => {
      cleanup = setup(self);
    }, scopeRef);

    return () => {
      if (typeof cleanup === "function") cleanup();
      context.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
