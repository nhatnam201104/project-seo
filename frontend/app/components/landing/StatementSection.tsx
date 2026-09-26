import { useRef } from "react";
import { gsap } from "gsap";
import { EASE, MEDIA, STAGGER } from "~/lib/animation";
import { useGsapContext } from "~/hooks/useGsapContext";
import { IMAGES, STATEMENT_LINES } from "./content";

/**
 * Campaign statement: media fullscreen + 2 dòng chữ in hoa cực đậm sát đáy,
 * fill chữ là chính ảnh nền (glass text — CSS background-clip trong CSS).
 * Desktop: section pin, chữ fade rời rạc theo từng từ ở nửa sau (như video).
 */
export function StatementSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGsapContext(sectionRef, () => {
    const matchMedia = gsap.matchMedia(sectionRef);

    matchMedia.add(MEDIA.desktop, () => {
      const words = gsap.utils.toArray<HTMLElement>(".lp-word");

      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=75%",
            pin: true,
            scrub: 0.8,
          },
        })
        // Nửa đầu giữ nguyên (0 → 0.5), nửa sau chữ tan dần từng từ.
        .to({}, { duration: 0.5 })
        .to(words, {
          autoAlpha: 0,
          yPercent: -18,
          ease: EASE.none,
          duration: 0.5,
          stagger: { each: STAGGER.word, from: "random" },
        });
    });

    matchMedia.add(MEDIA.mobile, () => {
      gsap.fromTo(
        ".lp-statement-text",
        { autoAlpha: 0, yPercent: 12 },
        {
          autoAlpha: 1,
          yPercent: 0,
          ease: EASE.out,
          duration: 0.9,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
          },
        },
      );
    });

    return () => matchMedia.revert();
  });

  return (
    <section
      ref={sectionRef}
      className="lp-statement"
      aria-labelledby="lp-statement-heading"
    >
      <div className="lp-statement-media">
        <img
          src={IMAGES.statement.srcSmall}
          srcSet={`${IMAGES.statement.srcSmall} 800w, ${IMAGES.statement.src} 1600w`}
          sizes="100vw"
          alt={IMAGES.statement.alt}
          loading="lazy"
          width={1600}
          height={1067}
        />
      </div>
      <h2 id="lp-statement-heading" className="lp-statement-text">
        {STATEMENT_LINES.map((line) => (
          <span key={line} className="lp-line">
            {line.split(" ").map((word, wordIndex) => (
              <span key={`${line}-${word}-${wordIndex}`} className="lp-word">
                {word}
                {wordIndex < line.split(" ").length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        ))}
      </h2>
    </section>
  );
}
