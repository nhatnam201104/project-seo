import { useRef } from "react";
import { gsap } from "gsap";
import { DURATION, EASE, STAGGER } from "~/lib/animation";
import { useGsapContext } from "~/hooks/useGsapContext";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { BRAND, IMAGES } from "./content";

const TITLE_LINES = ["NHÌN RÕ.", "ĐÚNG GU."] as const;

/**
 * Hero fullscreen: ảnh reveal bằng clip-path khi tải trang, tiêu đề
 * xuất hiện theo dòng, chi tiết hình học + scroll cue vào sau cùng.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useGsapContext(
    sectionRef,
    () => {
      if (prefersReducedMotion) return;

      gsap
        .timeline({ defaults: { ease: EASE.out } })
        .fromTo(
          ".lp-hero-media",
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 1.2 },
        )
        .fromTo(
          ".lp-hero-media img",
          { scale: 1.14 },
          { scale: 1, duration: 1.6 },
          0,
        )
        .fromTo(
          ".lp-hero-title .lp-line > span",
          { yPercent: 112 },
          { yPercent: 0, duration: DURATION.reveal, stagger: STAGGER.line },
          0.5,
        )
        .fromTo(
          [".lp-hero-meta", ".lp-hero-season", ".lp-scroll-cue", ".lp-hero-sigil"],
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
          0.9,
        );
    },
    [prefersReducedMotion],
  );

  return (
    <section
      ref={sectionRef}
      className="lp-hero"
      aria-labelledby="lp-hero-heading"
    >
      <div className="lp-hero-media">
        <img
          src={IMAGES.hero.srcSmall}
          srcSet={`${IMAGES.hero.srcSmall} 800w, ${IMAGES.hero.src} 1600w`}
          sizes="100vw"
          alt={IMAGES.hero.alt}
          width={1600}
          height={2000}
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <p className="lp-hero-meta">
        {BRAND.campaign} · {BRAND.location}
      </p>

      <h1 id="lp-hero-heading" className="lp-hero-title">
        {TITLE_LINES.map((line) => (
          <span key={line} className="lp-line">
            <span>{line}</span>
          </span>
        ))}
      </h1>

      <p className="lp-hero-season">{BRAND.season}</p>

      <svg className="lp-hero-sigil" viewBox="0 0 140 140" aria-hidden="true">
        <rect
          x="30"
          y="30"
          width="80"
          height="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          transform="rotate(45 70 70)"
        />
      </svg>

      <div className="lp-scroll-cue" aria-hidden="true" />
    </section>
  );
}
