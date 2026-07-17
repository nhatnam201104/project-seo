import { useCallback, useState } from "react";
import { useLenis } from "~/hooks/useLenis";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { SiteHeader } from "./SiteHeader";
import { MenuOverlay } from "./MenuOverlay";
import { HeroSection } from "./HeroSection";
import { GallerySection } from "./GallerySection";
import { StatementSection } from "./StatementSection";
import { ManifestoSection } from "./ManifestoSection";
import { ShowcaseSection } from "./ShowcaseSection";
import { FinalSection } from "./FinalSection";
import "./landing.css";

/**
 * Compose toàn bộ landing page eyewear ProjectSale.
 * Nội dung render đầy đủ phía server (SEO); Lenis + GSAP chỉ chạy client.
 * Reduced motion → tắt smooth scroll, các section tự hạ cấp về fade ngắn.
 */
export function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useLenis(!prefersReducedMotion);

  const toggleMenu = useCallback(() => setIsMenuOpen((open) => !open), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <div className="lp">
      <SiteHeader isMenuOpen={isMenuOpen} onToggleMenu={toggleMenu} />
      <MenuOverlay isOpen={isMenuOpen} onClose={closeMenu} />

      <main>
        <HeroSection />
        <GallerySection />
        <StatementSection />
        <ManifestoSection />
        <ShowcaseSection />
        <FinalSection />
      </main>
    </div>
  );
}
