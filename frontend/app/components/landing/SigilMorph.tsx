/**
 * Sigil — cụm shape hình học neo giữa gallery, morph theo từng bước trượt
 * (diamond outline → squiggle texture → triangle) như bản tham chiếu.
 * Component chỉ render SVG; GallerySection điều khiển crossfade/rotate
 * giữa các shape qua class `.lp-sigil-shape[data-sigil]`.
 */
export function SigilMorph() {
  return (
    <div className="lp-sigil" aria-hidden="true">
      <svg className="lp-sigil-shape" data-sigil="diamond" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="lp-sigil-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a52" />
            <stop offset="55%" stopColor="#3e8f8a" />
            <stop offset="100%" stopColor="#d9dde2" />
          </linearGradient>
        </defs>
        <rect
          x="28"
          y="28"
          width="84"
          height="84"
          fill="none"
          stroke="url(#lp-sigil-grad)"
          strokeWidth="11"
          transform="rotate(45 70 70)"
        />
      </svg>

      <svg className="lp-sigil-shape" data-sigil="squiggle" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="lp-sigil-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9dde2" />
            <stop offset="45%" stopColor="#8fa8b5" />
            <stop offset="100%" stopColor="#2e4a5e" />
          </linearGradient>
        </defs>
        <path
          d="M22 86 C34 44 62 40 74 62 C86 84 100 92 118 60"
          fill="none"
          stroke="url(#lp-sigil-metal)"
          strokeWidth="26"
          strokeLinecap="round"
        />
      </svg>

      <svg className="lp-sigil-shape" data-sigil="triangle" viewBox="0 0 140 140">
        <defs>
          <pattern
            id="lp-sigil-tex"
            patternUnits="userSpaceOnUse"
            width="140"
            height="140"
          >
            <image
              href="/landing/final-800.webp"
              x="0"
              y="0"
              width="140"
              height="140"
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        </defs>
        <path
          d="M70 18 L118 116 L94 116 L70 66 L46 116 L22 116 Z"
          fill="url(#lp-sigil-tex)"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}
