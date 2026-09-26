import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Khởi tạo Lenis smooth-scroll và đồng bộ với GSAP ScrollTrigger.
 * - Lenis chạy trong ticker của GSAP (một RAF duy nhất cho cả trang).
 * - Tự huỷ khi unmount hoặc khi `enabled` đổi (reduced motion → tắt hẳn).
 */
export function useLenis(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    // Lenis đã lo smoothing — tắt lag smoothing của GSAP để tránh giật đôi.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.off("scroll", onScroll);
      lenis.destroy();
    };
  }, [enabled]);
}
