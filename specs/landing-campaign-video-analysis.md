---
title: Landing page campaign — phân tích video tham chiếu & kế hoạch triển khai
status: complete
created: 2026-07-17
updated: 2026-07-17
refs:
  video: frontend/public/video/Screen Recording 2026-07-16 215319.mp4
  files:
    - frontend/app/routes/landing.tsx
    - frontend/app/components/landing/
---

# Phân tích video tham chiếu & kế hoạch triển khai landing page

Video nguồn: 740×550, 30fps, 10.63s (319 frames). Đã trích 53 frame @5fps
toàn cục + 72 frame @15fps quanh 5 điểm chuyển cảnh.

## 1. Tổng quan phong cách

Website campaign của một thương hiệu outdoor-fashion hư cấu ("ALP1NE™" trong
video — KHÔNG sao chép). Phong cách:

- **Editorial / fashion campaign** — ảnh chiếm toàn viewport, chữ nhỏ tinh tế.
- **Khung giấy trắng**: toàn bộ nội dung inset trong viền trắng ~8px quanh
  viewport; header là dải tab trắng viền đen 1px kiểu "file-folder".
- Palette hình ảnh thống nhất: trời trắng sương mù, rêu xanh ô-liu, đồ kỹ
  thuật xám bạc, mũ vàng mù tạt, tóc hồng — tương phản cao, ánh sáng phẳng.
- Ngôn ngữ glyph kỹ thuật xen giữa chữ: ✧ ◇ ÷ ↑ ∿ ∧ ∴ ≠ ⟶ ✦
- Motion: trượt ngang panel lớn, morph shape SVG, parallax cutout, chữ fill
  texture kính mờ — mượt, có chủ đích, nhịp điệu rõ.

## 2. Danh sách scene & timeline (theo thứ tự video)

| # | t (s) | Scene | Mô tả |
|---|-------|-------|-------|
| S1 | 0.0–2.0 | **Horizontal gallery** (pinned) | Các panel ảnh trượt phải→trái. Panel split-screen; shape SVG morph tại mép nối; tag pill sản phẩm (tên + glyph + giá) góc dưới panel. Thứ tự tag: `$1,200` → `Arc Layer ◇ $890` → `Field Cap ÷ $180` → `Summit Haul 40 ↑ $540` |
| S2 | 2.2–3.4 | **Campaign statement** | Video/ảnh model fullscreen; 2 dòng chữ in hoa cực đậm sát đáy: "WE WORK IN WEATHERED NYLON, LAMINATED LAYERS, AND RAW SHELL." Fill chữ = texture kính mờ (ảnh xuyên qua chữ). Chữ fade dần khi scroll tiếp |
| S3 | 3.6–4.2 | **Bridge** | Ảnh model ngồi thu nhỏ dần lên trên; section ô-liu trùm lên từ đáy viewport |
| S4 | 4.2–5.6 | **Manifesto** (olive) | Nền ô-liu #5a5733; đoạn văn editorial màu lavender, first-line indent, glyph xen giữa từ; 8+ ảnh cutout sản phẩm (áo, quần short, mũ, kính, balo, giày, xà cạp) bay parallax đè lên chữ, tốc độ khác nhau |
| S5 | 5.6–6.0 | **Zoom-window reveal** | Cuối manifesto: khung ảnh nhỏ (~36% viewport) hiện giữa nền ô-liu, có diamond outline đè lên; khung scale mở rộng ra fullscreen |
| S6 | 6.0–10.6 | **Gallery lặp lại** | Sau zoom-window, gallery ngang chạy tiếp (video quay vòng trải nghiệm lần 2 — site có cấu trúc loop) |

## 3. Thành phần & motion specification chi tiết

### 3.1 Header (persistent)
- Dải trắng cao ~28px, các item là "tab" trắng viền đen 1px dính mép trên.
- Trái: logo `ALP1NE™` (11px, bold). Cạnh đó: đồng hồ live `19:41:54 (PST) Tuesday July 7 2026` — tick mỗi giây.
- Giữa: `Collection` `Journal` `About`. Phải: `Instagram` `Press`.
- Nút vuông bo góc xám đậm (~44px) chứa icon X, float góc phải dưới header
  (trong bản của ta: nút toggle menu overlay).
- Custom scrollbar: thumb tối, mảnh, bo tròn, bên phải.

### 3.2 Horizontal gallery (S1) — hiệu ứng chữ ký
- **Trigger**: section pin toàn viewport, wheel/scroll advance panel.
- **Panel slide**: mỗi bước ~0.7s, ease dạng `power2.inOut`/`expo.inOut`;
  panel mới trượt từ phải vào, panel cũ trượt ra trái CHẬM HƠN (bị đè lên,
  để lại sliver ở mép trái trong lúc chuyển) → cảm giác depth.
- **Inner parallax**: ảnh trong panel rộng hơn panel ~15–20%, translateX
  ngược hướng khi panel di chuyển (`x: -18% → 0`), tạo hiệu ứng "mở cửa sổ".
- **Sigil (shape SVG)**: một shape duy nhất neo gần tâm viewport
  (x≈47%, y≈55%, kích thước 140–180px), morph/crossfade qua các hình:
  diamond outline (stroke ~10px) → squiggle ∿ (fill texture ảnh/kim loại)
  → diamond gradient navy-teal → triangle ▲ (fill texture). Morph xảy ra
  đồng bộ với chuyển panel, duration ~0.7s cùng easing.
- **Product tag**: 2 pill trắng (viền #111 1px, radius 4px, text 11px):
  `[Tên + glyph] [giá]`, cách nhau 6px, đặt bottom-left của panel
  (offset ~24px), translate cùng panel.
- **Z-index**: sigil > tag > panel mới > panel cũ.
- **Mobile**: gallery chuyển thành vertical stack, mỗi ảnh reveal bằng
  clip-path khi vào viewport; sigil thu nhỏ đặt cố định giữa các ảnh.

### 3.3 Campaign statement (S2)
- Media fullscreen (video trong bản gốc → ta dùng ảnh + ken-burns zoom 1.0→1.06 chậm 12s).
- Chữ: 2 dòng, uppercase, weight 800–900, tracking hẹp, cỡ ~8.5vw, căn giữa,
  neo sát đáy (bottom ~2%).
- Fill chữ: `background-clip: text` với chính ảnh nền (dịch + blur + tăng
  sáng nhẹ) → hiệu ứng kính mờ/refraction; text-shadow rim tối 1px.
- **Scroll**: section pin ~1.5 viewport; progress 0→0.5 chữ giữ nguyên,
  0.5→1 chữ fade opacity 1→0 (per-word stagger nhẹ), media giữ.
- **Mobile**: cỡ chữ 11vw, 3 dòng, giữ nguyên cơ chế.

### 3.4 Manifesto (S4)
- Nền `#5a5733` (olive), chữ `#aca6d9` (lavender xám), cỡ ~4.6vw desktop
  (clamp 26–54px), weight 600, line-height 1.15, first-line indent 2.5em,
  các đoạn cách nhau ~1em. Padding ngang ~2vw. 5 đoạn văn.
- Glyph xen giữa từ, cùng màu chữ.
- **Cutouts**: 7–9 ảnh sản phẩm nhỏ (180–300px) rải khắp section, z trên
  chữ, mỗi cái parallax `y` tốc độ khác nhau (lerp 0.85–1.3× scroll) + rotate
  nhẹ ±6°. (Bản gốc là PNG cutout — ta dùng chip ảnh bo góc, duotone-hoá
  bằng filter để đồng nhất art direction.)
- **Text reveal**: mỗi đoạn fade+rise 24px khi vào viewport, stagger theo đoạn.
- Section này scroll tự nhiên (không pin).

### 3.5 Zoom-window / Final reveal (S5)
- Trigger: pin section cuối manifesto ~1.5 viewport.
- Initial: window 36vw×36vh giữa màn hình, nền ô-liu bao quanh; diamond
  outline trắng đè giữa window.
- Final: window scale lên 100vw×100vh (dùng `clip-path: inset()` scrub —
  không animate width/height), ảnh bên trong scale 1.15→1.0.
- Sau khi full: hiện logo lớn + CTA + footer.

### 3.6 Live clock, easing chung
- Đồng hồ: `HH:MM:SS (GMT+7) Weekday Month D YYYY` tick 1s (RAF, không setInterval drift).
- Easing hệ thống: `expo.out` cho reveal, `power2.inOut`/`expo.inOut` cho slide/morph,
  `none` cho scrub. Duration: micro 0.3s / slide 0.7s / reveal 0.9–1.1s.
  Stagger chữ: 0.04–0.08s.

## 4. Hệ thống thiết kế

- **Màu**: paper `#ffffff`; ink `#111114`; olive `#5a5733`; lavender `#aca6d9`;
  steel-navy gradient `#1e3a52→#3e8f8a` (sigil); xám nút `#6b6b6b`.
- **Typography**: 1 font grotesk variable — **Archivo** (self-host,
  SIL OFL): Expanded 800/900 cho statement; 600 cho manifesto; 400/500 11–12px
  cho header/tag. Không dùng font thứ 2 (đúng tinh thần bản gốc 1 family).
- **Spacing**: khung trắng 8px quanh page; padding panel 24px; section olive
  padding dọc ~12vh.
- **Grid**: gallery không theo grid cột — panel theo tỷ lệ 40/60, 57/43,
  fullscreen; manifesto 1 cột full-bleed.
- **Ảnh**: crop chủ thể giữa/lệch nhẹ; luôn `object-fit: cover`;
  desktop AVIF/WebP ~1600w, mobile 800w, `srcset` + `sizes`.

## 5. Phân công kỹ thuật hiệu ứng

| Hiệu ứng | Công nghệ |
|---|---|
| Slide panel + pin + scrub | GSAP ScrollTrigger (pin + scrub/snap) |
| Inner parallax panel | GSAP (cùng timeline slide) |
| Sigil morph | SVG crossfade/scale-rotate giữa 3 path + `<pattern>`/gradient fill, điều khiển bằng GSAP timeline (không cần MorphSVG trả phí) |
| Statement glass text | CSS `background-clip:text` + ảnh; fade bằng ScrollTrigger scrub |
| Ken-burns, hover scale, pill, focus | CSS thuần (transition/animation) |
| Cutout parallax | GSAP scrub `y`/`rotate` |
| Zoom-window | ScrollTrigger scrub `clip-path: inset()` + scale ảnh |
| Smooth scroll | **Lenis** + đồng bộ `lenis.on('scroll', ScrollTrigger.update)` |
| Menu overlay | GSAP timeline (clip-path circle/inset + stagger item) |
| Live clock | RAF hook |
| WebGL | **Không cần** — không có distortion/shader thực sự trong video |

## 6. Kiến trúc triển khai

Route mới `routes/landing.tsx` (index) — SSR render tĩnh toàn bộ nội dung
(SEO ok), animation chỉ chạy client sau hydrate. Danh sách sản phẩm hiện tại
chuyển sang `/products` (giữ nguyên file `home.tsx` → đổi tên `products.tsx`).

```
frontend/app/
├── components/landing/
│   ├── LandingPage.tsx        # compose các section + Lenis + GSAP context
│   ├── SiteHeader.tsx         # tab header + clock + nút menu
│   ├── MenuOverlay.tsx        # fullscreen menu (clip-path + stagger)
│   ├── HeroSection.tsx        # hero fullscreen + title reveal + scroll cue
│   ├── GallerySection.tsx     # pinned horizontal gallery + sigil + tags
│   ├── SigilMorph.tsx         # SVG shape morph component
│   ├── StatementSection.tsx   # glass text + pinned fade
│   ├── ManifestoSection.tsx   # olive + cutouts parallax
│   ├── ShowcaseSection.tsx    # index list sản phẩm (hover preview)
│   ├── FinalSection.tsx       # zoom-window + logo + CTA + footer
│   ├── landing.css            # toàn bộ style (design tokens riêng --lp-*)
│   └── content.ts             # dữ liệu nội dung (brand, câu chữ, sản phẩm, ảnh)
├── hooks/
│   ├── useLenis.ts            # khởi tạo Lenis + sync ScrollTrigger
│   ├── useGsapContext.ts      # gsap.context + cleanup theo scope
│   ├── useClock.ts            # đồng hồ RAF
│   └── useReducedMotion.ts    # media query hook
└── lib/animation.ts           # hằng số DURATION / EASE / BREAKPOINT
```

- **Thương hiệu hư cấu**: `M0RAINE™` — campaign "FIELD SEQUENCE 02 — ABOVE THE
  TREELINE", AW26. Sản phẩm: Cirque Shell ◇ $920 / Talus Cap ÷ $160 /
  Cwm Pack 38 ↑ $480 / Scree Short ∿ $210.
- **Ảnh**: tải từ Unsplash (license Unsplash, không watermark) về
  `frontend/public/landing/`, kèm `CREDITS.md` ghi nguồn; grade đồng nhất
  bằng CSS filter (`saturate(.92) contrast(1.04)`) + overlay sương.
- **Preload**: hero image `<link rel=preload fetchpriority=high>`; ảnh
  below-fold `loading=lazy`; font preload 1 file woff2.
- **Layout shift**: mọi ảnh có width/height/aspect-ratio; section pin có
  chiều cao đặt trước.
- **Reduced motion**: tắt Lenis, tắt pin/scrub (gallery thành stack dọc,
  statement/final hiển thị tĩnh), thay bằng fade ngắn 0.3s; kiểm tra qua
  `useReducedMotion` + `gsap.matchMedia`.
- **Thiết bị yếu/mobile**: không pin gallery trên <768px (vertical layout),
  cutout giảm còn 4, không blur runtime, `will-change` chỉ đặt trong lúc tween.

## 7. Điểm chấp nhận khác video (ghi nhận trước)

- Media trong video gốc có các CLIP VIDEO model chuyển động → ta thay bằng
  ảnh tĩnh + ken-burns (không có footage bản quyền tương đương).
- Cutout PNG sản phẩm → chip ảnh bo góc duotone (không có ảnh nền trong suốt
  từ nguồn miễn phí; giữ tinh thần collage-parallax).
- Nút X (close campaign) → nút menu overlay (brief yêu cầu menu).
- Video không quay footer/menu → thiết kế mới theo cùng ngôn ngữ.

---

# BÁO CÁO BÀN GIAO (sau triển khai + 1 vòng tinh chỉnh)

## Kết quả verify (2026-07-17)

- `npm run typecheck` ✓ · `npm run lint --max-warnings=0` ✓ · `npm test` 9/9 ✓
  · `npm run build` ✓ · console trình duyệt: **0 error, 0 warning** (đo bằng
  Edge headless qua toàn bộ hành trình scroll, desktop 1440 + mobile 375).
- Đã chụp 25+ screenshot đối chiếu từng scene với frame video (desktop
  1440×900, mobile 375×720, reduced-motion).

## Hướng dẫn

- Cài & chạy: `cd frontend && npm install && npm run dev` (không cần backend
  cho landing). Build: `npm run build` → `npm start` (react-router-serve;
  tương đương preview).
- Đổi nội dung/ảnh/sản phẩm: `app/components/landing/content.ts` (một file
  duy nhất — brand, nav, copy, panel gallery, chip manifesto, CTA).
- Tinh chỉnh animation: `app/lib/animation.ts` (DURATION/EASE/STAGGER/MEDIA);
  hiệu ứng phức tạp có comment tại chỗ trong từng section component.
- Thay ảnh: bỏ file vào `public/landing/` (kèm biến thể -800/-1600), cập nhật
  `content.ts` + `CREDITS.md`.

## Vòng tinh chỉnh đã thực hiện

1. Chữ statement: `background-clip: text` đa layer render không ổn định trong
   Chromium → chuyển sang fill trắng bán trong suốt + text-stroke rim tối +
   shadow (đúng look "kính mờ" của video, ổn định mọi browser).
2. Sigil squiggle: texture ảnh tối/khó đọc → gradient kim loại bạc-thép;
   texture ảnh chuyển sang shape triangle (ảnh mây sáng).
3. Diamond hero stroke 2→5; dòng CTA final tăng contrast (trắng + shadow).

## Báo cáo responsive

- 1440+/1280: gallery pin + trượt ngang, đầy đủ hiệu ứng. 768–1279: như
  desktop (pin theo `min-width: 768px`). <768: gallery thành stack dọc
  clip-path reveal, statement không pin, chip manifesto còn 4, ẩn clock +
  social + season + arrow showcase ở <480. Đã chụp 375; layout không vỡ,
  không tràn ngang; tag/nút ≥40px vùng chạm.

## Báo cáo accessibility

- Semantic: header/nav/main/section/h1-h2/footer; heading có id + aria-labelledby.
- Menu overlay: `role=dialog aria-modal`, ESC đóng, focus vào link đầu khi mở,
  `aria-expanded` trên nút, tabIndex -1 khi đóng; khoá scroll khi mở.
- Alt text mọi ảnh nội dung; ảnh trang trí `alt=""` + `aria-hidden`.
- `prefers-reduced-motion: reduce`: đã test bằng emulation — 0 pin-spacer,
  không Lenis, mọi nội dung hiển thị tĩnh, transition rút còn ≤150ms.
- Focus-visible outline 2px; hover không phải cách duy nhất truy cập nội dung
  (preview showcase chỉ là trang trí, link vẫn hoạt động).

## Báo cáo performance

- JS route landing: 58 kB gzip (gsap + lenis + components) + framework
  ~104 kB gzip → tổng ~162 kB. CSS landing 3.7 kB gzip. Vượt budget landing
  150 kB một chút do React Router SSR framework — chấp nhận vì landing nằm
  trong app SSR chung; có thể tách sau nếu cần.
- Hero preload (`fetchPriority=high`, tách media query 800/1600); các ảnh còn
  lại lazy; font 1 file woff2 90 kB preload, `font-display: swap`.
- Mọi animation chỉ transform/opacity/clip-path; Lenis chạy trong GSAP ticker
  (1 RAF); gsap.context + matchMedia revert sạch khi unmount (test StrictMode
  mount đôi không tạo trigger trùng).
- Mọi ảnh có width/height/aspect-ratio — không CLS đo được khi scroll.

## Khác biệt còn lại so với video tham chiếu

1. Media là ảnh tĩnh + ken-burns, không phải video clip model chuyển động.
2. Sigil crossfade + xoay giữa 3 shape, không morph path liền mạch
   (MorphSVG là plugin trả phí; crossfade giữ đúng nhịp/vị trí).
3. Cutout manifesto là chip ảnh chữ nhật bo góc, không phải PNG khử nền.
4. Chữ statement fill kính mờ đồng nhất, không refract ảnh thật từng vùng
   (cần WebGL text — ngoài phạm vi, video cũng chỉ hơi ánh texture).
5. Gallery của ta 4 panel/1 vòng, video lặp vô hạn 2 vòng+ (chủ đích: landing
   cần dẫn tiếp xuống statement/manifesto thay vì loop).
