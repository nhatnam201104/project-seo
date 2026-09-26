import { useRef } from "react";
import { gsap } from "gsap";
import { EASE, MEDIA } from "~/lib/animation";
import { useGsapContext } from "~/hooks/useGsapContext";
import { MANIFESTO_CHIPS, MANIFESTO_PARAGRAPHS } from "./content";

/**
 * Manifesto trên nền olive: đoạn văn lavender xen glyph kỹ thuật,
 * các chip ảnh sản phẩm trôi parallax với tốc độ khác nhau đè lên chữ
 * (thay cho cutout PNG của bản tham chiếu).
 */
export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGsapContext(sectionRef, () => {
    // Đoạn văn: fade + rise khi vào viewport (mọi breakpoint có motion).
    const matchMedia = gsap.matchMedia(sectionRef);

    const setupParagraphs = () => {
      gsap.utils.toArray<HTMLElement>(".lp-manifesto p").forEach((paragraph) => {
        gsap.fromTo(
          paragraph,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: EASE.out,
            scrollTrigger: { trigger: paragraph, start: "top 82%" },
          },
        );
      });
    };

    const setupChips = (strength: number) => {
      gsap.utils.toArray<HTMLElement>(".lp-chip").forEach((chip) => {
        const speed = Number(chip.dataset.speed ?? 1);
        const drift = (1 - speed) * 420 * strength;
        gsap.fromTo(
          chip,
          { y: -drift },
          {
            y: drift,
            ease: EASE.none,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    };

    matchMedia.add(MEDIA.desktop, () => {
      setupParagraphs();
      setupChips(1);
    });
    matchMedia.add(MEDIA.mobile, () => {
      setupParagraphs();
      setupChips(0.5);
    });

    return () => matchMedia.revert();
  });

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      className="lp-manifesto"
      aria-label="Tuyên ngôn thương hiệu"
    >
      <div className="lp-manifesto-inner">
        {MANIFESTO_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <div className="lp-manifesto-chips" aria-hidden="true">
        {MANIFESTO_CHIPS.map((chip) => (
          <div
            key={chip.src}
            className="lp-chip"
            data-speed={chip.speed}
            style={{
              top: chip.top,
              left: chip.left,
              width: chip.width,
              transform: `rotate(${chip.rotate}deg)`,
            }}
          >
            <img src={chip.src} alt="" loading="lazy" width={480} height={640} />
          </div>
        ))}
      </div>
    </section>
  );
}
