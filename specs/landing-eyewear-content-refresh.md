---
title: Refresh landing page content and imagery for eyewear commerce
status: implementing
created: 2026-07-17
updated: 2026-07-17
refs:
  specs:
    - specs/landing-campaign-video-analysis.md
    - specs/postgres-backend-foundation-catalog.md
    - specs/fix-showcase-preview-anchor.md
  files:
    - docs/business-requirements.html
    - docs/PRD.html
    - frontend/app/routes/landing.tsx
    - frontend/README.md
    - frontend/app/components/landing/content.ts
    - frontend/app/components/landing/HeroSection.tsx
    - frontend/app/components/landing/ShowcaseSection.tsx
    - frontend/app/components/landing/landing.css
    - frontend/public/landing/CREDITS.md
---

# Refresh landing page content and imagery for eyewear commerce

## Intent

Chuyen landing page tu campaign outdoor-fashion hu cau sang trang gioi thieu thuong mai dien tu mat kinh ProjectSale, dung voi PRD va thi truong Viet Nam. Giu lai giao dien editorial, motion va preview interaction dang on dinh, nhung thay toan bo copy, metadata, san pham mau va hinh anh de nguoi dung nhan ra ngay day la website ban gong kinh, kinh can, kinh ram va trong kinh.

## Decisions

- Dung ten san pham hien co trong PRD la `ProjectSale`, khong tao them mot thuong hieu hu cau moi.
- Giu nguyen bo cuc, typography, mau sac, GSAP timelines va controller preview; thay doi chi o lop noi dung, metadata va asset de tranh lam hong giao dien da duoc duyet.
- Noi dung chinh dung tieng Viet, ngan gon va mang tinh editorial; cac nhan dieu huong/call-to-action phai noi ro hanh dong mua sam va phan noi dung tren trang se huong dan chon kinh.
- Du an chua co hotline, email ho tro hay social URL ProjectSale da duoc xac thuc. Loai bo cac link `Instagram`/`Press` gia lap va khong tu tao thong tin lien he; CTA thuong mai chi dan toi route `/products` dang ton tai. Kenh tu van truc tiep duoc de lai cho mot spec sau khi co thong tin doanh nghiep that.
- Campaign moi tap trung vao gia tri trong PRD: mat kinh chinh hang, gia minh bach, chon gong theo khuon mat, lua chon trong theo nhu cau va mua online thuan tien. Khong quang ba thu kinh ao AR vi PRD xep vao Won't-have.
- Danh sach showcase gom bon nhom editorial dai dien cho catalog: gong acetate, gong titanium, kinh ram chong UV va trong loc anh sang xanh. Gia hien thi bang VND; copy co the nhac nhu cau/khuon mat phu hop nhung khong mo rong `CampaignProduct` thanh DTO taxonomy va khong gia lap du lieu API.
- Anh moi chi lay tu nguon mien phi co trang license ro rang (uu tien Unsplash/Pexels), duoc tai ve local, tao cap WebP 800/1600 khi can, viet alt text tieng Viet va cap nhat credits den tung anh/nhiep anh gia. Khong hotlink anh ngoai va khong dung anh cua retailer/brand canh tranh.
- Giu ten file asset on dinh neu co the de han che diff; neu doi ten, cap nhat dong bo preload, content mapping, tests va credits.
- Implementation duoc phep tiep tuc tim va tu chon du anh mien phi cho 8 visual slot responsive va 6 manifesto chip, mien moi anh dat tieu chi eyewear, crop phu hop va co credits ro rang. Co the dung cung mot anh san pham cho preview/chip lien quan neu crop khac nhau co chu dich, nhung khong lap anh hero/gallery.
- Cho phep chinh `object-position`/focus crop trong CSS hoac content data de gong kinh va khuon mat khong bi cat; day la hieu chinh asset, khong phai redesign.
- Truoc khi sua cac file/asset hien co, tao backup co pham vi duoi `backups/landing-eyewear-content/`; xoa backup sau khi test, build va browser verification deu dat.

## Approach

Truoc tien doi chieu copy voi PRD va gom noi dung landing vao mot campaign ProjectSale nhat quan tu hero den CTA cuoi. Sau do chon mot bo anh eyewear co cung ngon ngu hinh anh editorial, tai ve va toi uu thanh asset responsive local de giu hieu nang hien tai. Phan implementation chi chinh data/copy va nhung hard-coded title/metadata con sot lai, khong refactor motion hay cau truc section. Cuoi cung render tren desktop va mobile, kiem tra tung section, alt text, preload, preview hover/scroll va chay day du test/typecheck/lint/build.

## Scope

**In:** landing page copy including the hard-coded `pieces` label; brand/campaign metadata; hero and statement headings; navigation labels; four showcase products and VND prices; manifesto/CTA; all landing photography and alt text; focal crop adjustments; route title/description/preload; image credits; cleanup of M0RAINE/outdoor references in landing comments and frontend README; regression test expectations affected by renamed products/assets; desktop/mobile visual verification.

**Out:** redesign layout or color system; changing GSAP motion; changing showcase preview controller; catalog/backend schema or API; seeding real products; product listing/detail redesign; cart/checkout; virtual try-on AR.

## Future Notes

Khi catalog co seed data that va API on dinh, showcase tren landing co the chuyen tu du lieu campaign tinh sang cac san pham noi bat tu backend. Viec do can spec rieng cho loading/error state, cache va fallback, khong nam trong dot refresh noi dung nay.

## Progress

Da doi chieu landing hien tai voi PRD/business requirements, xac nhan mau thuan noi dung outdoor va xac dinh cac diem hard-coded ngoai `content.ts`. Da tim nguon anh eyewear mien phi tu Unsplash/Pexels; spec da pass technical review va duoc nguoi dung phe duyet.

- 2026-07-17: Bat dau implementation; chuyen spec sang `implementing`, chuan bi backup noi dung/test/asset truoc khi thay doi.
- 2026-07-17: Da tao backup 9 file va 22 asset cu. Da chon 14 anh Unsplash free-license, tai ban 1800px va tao lai du 22 WebP responsive/chip theo kich thuoc hien tai.
- 2026-07-17: Da chuyen toan bo copy sang ProjectSale/eyewear, gia VND, navigation noi bo, bo link lien he gia, cap nhat hero/SEO/showcase/manifesto/CTA/test fixtures/README va credits. Khong con chuoi M0RAINE/outdoor cu trong landing scope.
- 2026-07-17: Visual pass desktop phat hien statement crop thap va ten PROJECTSALE dai hon logo cu; da dua crop len vung mat/kinh, giam final logo de khong overflow va Viet hoa nhan `Index` thanh `Lua chon`.
- 2026-07-17: Mobile 390px phat hien nav moi dai lam header wrap; da rut nhan thanh `Mua kinh / Chon kinh / Ve shop` de giu mot hang ma khong doi layout.
- 2026-07-17: Mobile visual pass da reserve khoang trong cho nut menu tai hero/showcase metadata va ha min font-size final logo de khong tran 390px.
- 2026-07-17: Verify cuoi dat 15/15 tests, typecheck, lint va production build. Browser visual pass dat desktop 1280px va mobile 390px; hero/gallery/statement/manifesto/showcase/final deu dung noi dung eyewear, asset hien thi day du, preview regression giu nguyen va console khong co error/warning.

## Review

_Filled in after completion._

## Learnings

_Filled in after completion._

- Mot mang rong khai bao bang `[] as const` bi suy luan thanh `readonly never[]`; registry du lieu rong van can explicit element type neu cac component dung `.map()` va doc thuoc tinh phan tu.

---

> **Agent reference — not for user review.** Everything below this line is working notes for implement-spec. Remove this section before committing.

## Implementation Notes

- `frontend/app/components/landing/content.ts` is the main content registry, but hero title remains hard-coded as `TITLE_LINES` in `HeroSection.tsx`; route SEO is hard-coded in `frontend/app/routes/landing.tsx`; `${PRODUCTS.length} pieces` remains hard-coded in `ShowcaseSection.tsx`.
- Keep `LandingImage` responsive pairs and existing dimensions/aspect-ratio contracts. Generate hero/panel/statement/final/menu at 1600 and 800 widths; chip assets only need the rendered-size-appropriate WebP.
- Update `frontend/public/landing/CREDITS.md` with source page, photographer/provider and license link for every replacement. Reject Unsplash+ or retailer-owned images; use only pages explicitly marked free under Unsplash/Pexels license.
- Candidate source discovery: Unsplash free photo `Arq71XxDVGI` for an editorial eyeglasses portrait; Unsplash free photos `7sP4jEOWyQw` and `KQlffmZC3JU` as additional portrait candidates; Pexels `25651729` for a clean frame product shot and `5201901` for an eyewear display. Final selection must be checked visually for crop compatibility before download.
- Current inventory is 8 responsive slots (`hero`, `menu`, `statement`, `final`, four gallery panels) plus 6 manifesto chips. Continue focused search during implementation until every slot is mapped; never use retailer-owned, Unsplash+, watermarked, or license-unclear imagery.
- Replace navigation with verified internal destinations such as `San pham` → `/products`, `Chon kinh` → `#manifesto`, and `ProjectSale` → `#final`; export an empty social-link list until real ProjectSale contact/social destinations are supplied.
- Preserve the behaviors covered by `ShowcaseSection.test.tsx`; update accessible-name and image-src fixtures when product names/assets change, then rerun the preview regression suite.
- Before editing, back up at least `content.ts`, `HeroSection.tsx`, `landing.tsx`, `CREDITS.md`, affected tests, and every asset path that will be overwritten.
