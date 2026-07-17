import { useRef } from "react";
import { Link } from "react-router";
import { gsap } from "gsap";
import { EASE } from "~/lib/animation";
import { useGsapContext } from "~/hooks/useGsapContext";
import { BRAND, PRODUCTS } from "./content";
import { useShowcasePreview } from "./useShowcasePreview";

/**
 * Collection showcase — index list sản phẩm kiểu editorial:
 * số thứ tự, tên + glyph, giá; hover đảo màu hàng + preview ảnh bám con trỏ
 * (chỉ trên thiết bị có con trỏ thật).
 */
export function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const preview = useShowcasePreview(
    previewRef,
    PRODUCTS[0]?.preview ?? "",
  );

  useGsapContext(sectionRef, () => {
    // Hàng reveal stagger khi vào viewport.
    gsap.fromTo(
      ".lp-showcase-row",
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: EASE.out,
        stagger: 0.08,
        scrollTrigger: { trigger: ".lp-showcase-list", start: "top 80%" },
      },
    );
  });

  return (
    <section
      ref={sectionRef}
      className="lp-showcase"
      aria-labelledby="lp-showcase-heading"
    >
      <h2 id="lp-showcase-heading" className="lp-showcase-heading">
        <span>{BRAND.campaign} — Lựa chọn</span>
        <span>{PRODUCTS.length} lựa chọn</span>
      </h2>

      <ul
        className="lp-showcase-list"
        onMouseMove={preview.handleMouseMove}
        onMouseLeave={preview.handleListLeave}
      >
        {PRODUCTS.map((product, index) => (
          <li className="lp-showcase-row" key={product.id}>
            <Link
              to="/products"
              onMouseEnter={(event) =>
                preview.handlePointerEnter(event, product.preview)
              }
              onMouseLeave={preview.handlePointerLeave}
              onFocus={(event) => preview.handleFocus(event, product.preview)}
              onBlur={preview.handleBlur}
            >
              <span className="lp-showcase-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="lp-showcase-name">
                {product.name}
                <span className="lp-showcase-glyph">{product.glyph}</span>
              </span>
              <span className="lp-showcase-price">{product.price}</span>
              <span className="lp-showcase-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div ref={previewRef} className="lp-showcase-preview" aria-hidden="true">
        <img
          src={preview.previewSrc}
          alt=""
          width={480}
          height={640}
          loading="lazy"
        />
      </div>
    </section>
  );
}
