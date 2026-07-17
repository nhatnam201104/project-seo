import { useRef } from "react";
import { Link } from "react-router";
import { gsap } from "gsap";
import { EASE, MEDIA } from "~/lib/animation";
import { useGsapContext } from "~/hooks/useGsapContext";
import { BRAND, FINAL_CTA, IMAGES, NAV_LINKS, SOCIAL_LINKS } from "./content";

/**
 * Final scene: "zoom window" — khung ảnh nhỏ giữa nền tối scale mở rộng
 * ra fullscreen theo scroll (clip-path, không animate width/height),
 * sau đó logo + CTA hiện lên. Kết bằng footer.
 */
export function FinalSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGsapContext(sectionRef, () => {
    const matchMedia = gsap.matchMedia(sectionRef);

    matchMedia.add(MEDIA.desktop, () => {
      gsap
        .timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: {
            trigger: ".lp-final-stage",
            start: "top top",
            end: "+=130%",
            pin: true,
            scrub: 0.9,
          },
        })
        .fromTo(
          ".lp-final-window",
          { clipPath: "inset(31% 34% 31% 34% round 10px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1 },
        )
        .fromTo(
          ".lp-final-window img",
          { scale: 1.22 },
          { scale: 1, duration: 1 },
          0,
        )
        .to(".lp-final-diamond", { rotate: 135, autoAlpha: 0, duration: 0.6 }, 0.3)
        .fromTo(
          ".lp-final-content",
          { autoAlpha: 0, yPercent: 8 },
          { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: EASE.out },
          0.62,
        );
    });

    matchMedia.add(MEDIA.mobile, () => {
      gsap.set(".lp-final-diamond", { autoAlpha: 0 });
      gsap.fromTo(
        ".lp-final-window",
        { clipPath: "inset(14% 8% 14% 8% round 10px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: EASE.none,
          scrollTrigger: {
            trigger: ".lp-final-stage",
            start: "top 75%",
            end: "top 15%",
            scrub: true,
          },
        },
      );
      gsap.fromTo(
        ".lp-final-content",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: EASE.out,
          scrollTrigger: { trigger: ".lp-final-stage", start: "top 30%" },
        },
      );
    });

    return () => matchMedia.revert();
  });

  return (
    <section
      ref={sectionRef}
      id="final"
      className="lp-final"
      aria-labelledby="lp-final-logo"
    >
      <div className="lp-final-stage">
        <div className="lp-final-window">
          <img
            src={IMAGES.final.srcSmall}
            srcSet={`${IMAGES.final.srcSmall} 800w, ${IMAGES.final.src} 1600w`}
            sizes="100vw"
            alt={IMAGES.final.alt}
            loading="lazy"
            width={1600}
            height={1067}
          />
        </div>

        <svg className="lp-final-diamond" viewBox="0 0 140 140" aria-hidden="true">
          <rect
            x="30"
            y="30"
            width="80"
            height="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            transform="rotate(45 70 70)"
          />
        </svg>

        <div className="lp-final-content">
          <p id="lp-final-logo" className="lp-final-logo">
            {BRAND.name}
          </p>
          <p className="lp-final-heading">{FINAL_CTA.heading}</p>
          <Link to={FINAL_CTA.to} className="lp-final-cta">
            {FINAL_CTA.action}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <footer className="lp-footer">
        <span>
          © {new Date().getFullYear()} {BRAND.name} — {BRAND.season}
        </span>
        <nav aria-label="Điều hướng footer">
          {NAV_LINKS.map((link) =>
            link.to.startsWith("#") ? (
              <a key={link.label} href={link.to}>
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ),
          )}
          {SOCIAL_LINKS.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </nav>
      </footer>
    </section>
  );
}
