import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { gsap } from "gsap";
import { DURATION, EASE, STAGGER } from "~/lib/animation";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { BRAND, IMAGES, NAV_LINKS, SOCIAL_LINKS } from "./content";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Menu overlay fullscreen: nền reveal bằng clip-path, item stagger,
 * đóng bằng ESC, khoá scroll khi mở, trả focus về nút menu khi đóng.
 */
export function MenuOverlay({ isOpen, onClose }: MenuOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Tạo timeline một lần; play/reverse theo trạng thái mở.
  useEffect(() => {
    if (!rootRef.current) return;
    const context = gsap.context(() => {
      const timeline = gsap
        .timeline({ paused: true, defaults: { ease: EASE.out } })
        .fromTo(
          rootRef.current,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0% 0 0% 0)", duration: DURATION.menu },
        )
        .fromTo(
          ".lp-menu-links li",
          { yPercent: 60, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: STAGGER.menuItem },
          0.25,
        )
        .fromTo(
          ".lp-menu-figure",
          { autoAlpha: 0, scale: 1.06 },
          { autoAlpha: 1, scale: 1, duration: 0.7 },
          0.35,
        );
      timelineRef.current = timeline;
    }, rootRef);
    return () => context.revert();
  }, []);

  // Điều khiển mở/đóng + khoá scroll + focus.
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (prefersReducedMotion) {
        timeline.progress(1);
      } else {
        timeline.timeScale(1).play();
      }
      // Đưa focus vào link đầu tiên để điều hướng bàn phím liền mạch.
      const firstLink = rootRef.current?.querySelector<HTMLElement>("a");
      firstLink?.focus({ preventScroll: true });
    } else {
      document.body.style.overflow = "";
      if (prefersReducedMotion) {
        timeline.progress(0).pause();
      } else {
        timeline.timeScale(1.4).reverse();
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, prefersReducedMotion]);

  // ESC đóng menu.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      id="lp-menu"
      ref={rootRef}
      className={`lp-menu${isOpen ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!isOpen}
    >
      <ul className="lp-menu-links">
        {NAV_LINKS.map((link, index) => (
          <li key={link.label}>
            {link.to.startsWith("#") ? (
              <a href={link.to} onClick={onClose} tabIndex={isOpen ? 0 : -1}>
                <span className="lp-menu-index">0{index + 1}</span>
                {link.label}
              </a>
            ) : (
              <Link to={link.to} onClick={onClose} tabIndex={isOpen ? 0 : -1}>
                <span className="lp-menu-index">0{index + 1}</span>
                {link.label}
              </Link>
            )}
          </li>
        ))}
        {SOCIAL_LINKS.map((link, index) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              tabIndex={isOpen ? 0 : -1}
            >
              <span className="lp-menu-index">0{NAV_LINKS.length + index + 1}</span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <figure className="lp-menu-figure">
        <img
          src={IMAGES.menu.srcSmall}
          srcSet={`${IMAGES.menu.srcSmall} 800w, ${IMAGES.menu.src} 1600w`}
          sizes="(max-width: 767px) 0px, 45vw"
          alt={IMAGES.menu.alt}
          loading="lazy"
          width={1600}
          height={1067}
        />
        <figcaption className="lp-menu-meta">
          <span>{BRAND.campaign}</span>
          <span>{BRAND.season}</span>
        </figcaption>
      </figure>
    </div>
  );
}
