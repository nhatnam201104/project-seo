/**
 * Hằng số hệ thống chuyển động của landing page.
 * Mọi duration/easing/breakpoint đều lấy từ đây — không hardcode rải rác
 * trong component để có thể tinh chỉnh toàn cục ở một chỗ.
 */

export const DURATION = {
  /** Micro-interaction: hover, focus, pill */
  micro: 0.3,
  /** Một bước trượt panel trong gallery */
  slide: 0.7,
  /** Reveal chữ/ảnh khi vào viewport */
  reveal: 1.0,
  /** Mở/đóng menu overlay */
  menu: 0.8,
  /** Ken-burns zoom chậm cho media fullscreen (giây) */
  kenBurns: 14,
} as const;

export const EASE = {
  /** Reveal nội dung */
  out: "expo.out",
  /** Trượt panel, morph sigil */
  inOut: "power2.inOut",
  /** Scrub theo scroll — tuyến tính */
  none: "none",
} as const;

export const STAGGER = {
  word: 0.05,
  line: 0.09,
  menuItem: 0.06,
} as const;

/** Breakpoint đồng bộ với landing.css */
export const BREAKPOINT = {
  /** Dưới ngưỡng này gallery chuyển sang layout dọc, tắt pin */
  desktop: 768,
} as const;

/** Media query dùng cho gsap.matchMedia */
export const MEDIA = {
  desktop: `(min-width: ${BREAKPOINT.desktop}px) and (prefers-reduced-motion: no-preference)`,
  mobile: `(max-width: ${BREAKPOINT.desktop - 1}px) and (prefers-reduced-motion: no-preference)`,
  reduced: "(prefers-reduced-motion: reduce)",
} as const;
