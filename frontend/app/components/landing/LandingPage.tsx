import { useLenis } from "~/hooks/useLenis";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { SiteHeader } from "./SiteHeader";
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
  useLenis(!prefersReducedMotion);

  return (
    <div className="lp">
      <SiteHeader />

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
