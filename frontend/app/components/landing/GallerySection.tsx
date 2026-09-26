import { useRef } from "react";
import { Link } from "react-router";
import { gsap } from "gsap";
import { EASE, MEDIA } from "~/lib/animation";
import { useGsapContext } from "~/hooks/useGsapContext";
import { GALLERY_PANELS, PRODUCTS } from "./content";
import { SigilMorph } from "./SigilMorph";

function findProduct(productId: string) {
  const product = PRODUCTS.find((item) => item.id === productId);
  if (!product) {
    throw new Error(`Không tìm thấy sản phẩm cho panel gallery: ${productId}`);
  }
  return product;
}

/**
 * Gallery ảnh chiến dịch.
 * - Desktop: pin toàn viewport, panel trượt phải→trái theo scroll (snap từng
 *   bước), ảnh bên trong parallax ngược hướng ("mở cửa sổ"), sigil SVG
 *   morph tại mỗi ranh giới — tái hiện chuyển cảnh của video tham chiếu.
 * - Mobile/reduced-motion: stack dọc, mỗi panel reveal bằng clip-path nhẹ.
 */
export function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGsapContext(sectionRef, () => {
    const matchMedia = gsap.matchMedia(sectionRef);

    matchMedia.add(MEDIA.desktop, () => {
      const root = sectionRef.current;
      if (!root) return;
      root.closest(".lp")?.classList.add("is-enhanced");

      const panels = gsap.utils.toArray<HTMLElement>(".lp-panel");
      const stepCount = panels.length - 1;
      if (stepCount < 1) return;

      // Trạng thái đầu: panel 0 tại chỗ, các panel sau chờ bên phải.
      panels.forEach((panel, index) => {
        gsap.set(panel, { xPercent: index === 0 ? 0 : 100, zIndex: index + 1 });
        // Ảnh phóng nhẹ để chừa biên cho parallax nội bộ không hở mép.
        gsap.set(panel.querySelector("img"), { scale: 1.12 });
      });

      const timeline = gsap.timeline({
        defaults: { ease: EASE.none },
        scrollTrigger: {
          trigger: ".lp-gallery-viewport",
          start: "top top",
          end: `+=${stepCount * 100}%`,
          pin: true,
          scrub: 0.9,
          snap: {
            snapTo: 1 / stepCount,
            duration: { min: 0.25, max: 0.65 },
            ease: EASE.inOut,
          },
          anticipatePin: 1,
        },
      });

      panels.forEach((panel, index) => {
        const previousPanel = panels[index - 1];
        if (index === 0 || !previousPanel) return;
        const position = index - 1;
        timeline
          // Panel mới trượt vào từ phải.
          .to(panel, { xPercent: 0, duration: 1 }, position)
          // Ảnh bên trong trôi ngược hướng — hiệu ứng "mở cửa sổ".
          .fromTo(
            panel.querySelector("img"),
            { xPercent: -9 },
            { xPercent: 0, duration: 1 },
            position,
          )
          // Panel cũ rời đi chậm hơn, bị panel mới đè lên (depth).
          .to(previousPanel, { xPercent: -32, duration: 1 }, position);
      });

      // Sigil morph: crossfade + xoay giữa các shape tại mỗi ranh giới.
      const shapes = gsap.utils.toArray<HTMLElement>(".lp-sigil-shape");
      const sigilOrder = GALLERY_PANELS.map((panel) => panel.sigil);
      shapes.forEach((shape) => {
        const isFirst = shape.dataset.sigil === sigilOrder[0];
        gsap.set(shape, { autoAlpha: isFirst ? 1 : 0 });
      });

      for (let step = 1; step <= stepCount; step += 1) {
        const from = shapes.find((s) => s.dataset.sigil === sigilOrder[step - 1]);
        const to = shapes.find((s) => s.dataset.sigil === sigilOrder[step]);
        const at = step - 0.72;
        if (from && from !== to) {
          timeline.to(
            from,
            { autoAlpha: 0, rotate: -80, scale: 0.55, duration: 0.45 },
            at,
          );
        }
        if (to && from !== to) {
          timeline.fromTo(
            to,
            { autoAlpha: 0, rotate: 80, scale: 0.55 },
            { autoAlpha: 1, rotate: 0, scale: 1, duration: 0.45 },
            at + 0.22,
          );
        }
      }

      return () => {
        root.closest(".lp")?.classList.remove("is-enhanced");
      };
    });

    matchMedia.add(MEDIA.mobile, () => {
      // Mobile: reveal từng panel bằng clip-path khi vào viewport.
      gsap.utils.toArray<HTMLElement>(".lp-panel").forEach((panel) => {
        gsap.fromTo(
          panel,
          { clipPath: "inset(12% 6% 12% 6%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: EASE.none,
            scrollTrigger: {
              trigger: panel,
              start: "top 85%",
              end: "top 30%",
              scrub: true,
            },
          },
        );
      });
    });

    return () => matchMedia.revert();
  });

  return (
    <section ref={sectionRef} className="lp-gallery" aria-label="Hình ảnh chiến dịch">
      <div className="lp-gallery-viewport">
        <div className="lp-gallery-track">
          {GALLERY_PANELS.map((panel) => {
            const product = findProduct(panel.productId);
            return (
              <article className="lp-panel" key={panel.productId}>
                <div className="lp-panel-media">
                  <img
                    src={panel.image.srcSmall}
                    srcSet={`${panel.image.srcSmall} 800w, ${panel.image.src} 1600w`}
                    sizes="100vw"
                    alt={panel.image.alt}
                    loading="lazy"
                    width={1600}
                    height={1067}
                    style={{ objectPosition: panel.focus }}
                  />
                </div>
                <Link
                  to="/products"
                  className="lp-tag"
                  aria-label={`${product.name} — ${product.price}`}
                >
                  <span className="lp-tag-pill">
                    {product.name} {product.glyph}
                  </span>
                  <span className="lp-tag-pill">{product.price}</span>
                </Link>
              </article>
            );
          })}
        </div>
        <SigilMorph />
      </div>
    </section>
  );
}
