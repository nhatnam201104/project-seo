---
title: Fix FIELD SEQUENCE 02 Index preview neo tren man hinh
status: implementing
created: 2026-07-17
updated: 2026-07-17
refs:
  specs:
    - specs/landing-campaign-video-analysis.md
  files:
    - frontend/app/components/landing/ShowcaseSection.tsx
    - frontend/app/components/landing/ShowcaseSection.test.tsx
    - frontend/app/components/landing/useShowcasePreview.ts
---

# Fix FIELD SEQUENCE 02 Index preview neo tren man hinh

## Intent

Bao dam anh preview trang tri cua danh sach FIELD SEQUENCE 02 — Index chi hien khi con tro thuc su tuong tac voi danh sach, va duoc an sau khi nguoi dung cuon/di chuyen ra noi khac. Loi da duoc tai hien tren `http://localhost:5173/`: preview van co `opacity: 1` va `visibility: visible` sau khi danh sach roi khoi vi tri tuong tac.

## Decisions

- Sua nguyen nhan o vong doi su kien hover/scroll, khong che anh bang CSS hay thay doi `position: fixed`, vi preview can tiep tuc bam con tro khi hover hop le.
- Doi kiem tra sau scroll sang mot nhip sau khi trinh duyet cap nhat hover va layout; dong thoi ghi nhan toa do ngay khi `mouseenter` xay ra de khong phu thuoc vao `mousemove` trong list.
- Them regression test cho thu tu su kien: scroll bat dau khi preview chua hien, sau do `mouseenter` bat preview trong cung nhịp, va buoc kiem tra sau layout phai an preview neu con tro khong con nam tren list.
- `mouseenter` se cap nhat toa do con tro; `focus` ban phim khong gia mao toa do. Neu nguoi dung cuon trong khi preview dang hien do focus, preview trang tri cung duoc an; link van giu focus va chuc nang dieu huong khong thay doi.
- Truoc khi sua controller, tao backup tai `backups/showcase-preview-controller/`, thong bao da tao, va xoa backup ngay sau khi toan bo verify dat (khong de qua mot tuan).
- Khong thay doi giao dien, anh, noi dung, dieu huong hay motion cua cac section khac.
- Sau khi stress-test phat hien loi doi nghich, gom hover/focus/scroll vao mot preview controller duy nhat. Scroll an preview ngay; sau 100 ms idle chi khoi phuc neu link pointer candidate van thuc su `:hover`. Focus candidate bi xoa khi scroll de khong neo anh ngoai viewport.

## Approach

Tach vong doi preview thanh mot hook controller co mot ham reconcile duy nhat cho hover, focus va scroll. Controller an preview khi scroll bat dau, debounce 100 ms de cho scroll on dinh, sau do chi khoi phuc pointer preview neu DOM link candidate van `:hover`; list boundary va blur van dong preview ngay. Tween show/hide tiep tuc dung `overwrite: auto`, timer/tween duoc cleanup khi unmount, va component chi con noi handler vao UI. Regression tests bao phu scroll-idle co/khong hover, leave list, focus suppression, rapid switching va cleanup; sau do stress-test browser nhieu vong theo ca hai huong.

## Scope

**In:** vong doi preview hover/focus cua `ShowcaseSection`, cleanup listener/timer/tween, regression test, verify desktop browser.

**Out:** thay doi thiet ke Index, refactor GSAP/Lenis toan trang, thay anh/noi dung san pham, thay motion cac section pinned khac.

## Progress

Da tai hien loi tren trinh duyet, xac dinh thu tu su kien scroll/`mouseenter` la nguyen nhan va hoan tat review ky thuat; spec dang cho nguoi dung phe duyet.

- 2026-07-17: Nguoi dung da phe duyet trien khai; bat dau tao regression test va sua vong doi preview.
- 2026-07-17: Da them regression test tai hien thu tu `scroll` roi `mouseenter`; test do tren code cu vi khong co RAF check duoc xep hang.
- 2026-07-17: Da them RAF geometry check co coalescing/cleanup va cap nhat toa do tai `mouseenter`; regression test da xanh.
- 2026-07-17: Verify dat 10/10 tests, typecheck, lint, production build va browser. Tren trinh duyet, preview hien `opacity: 1` khi focus Index, sau khi scroll khoi section chuyen thanh `opacity: 0`, `visibility: hidden`; console khong co error/warning.
- 2026-07-17: Nguoi dung bao cao preview van neo khi chi keo con tro tu Index xuong About. Dieu tra lai cho thay ban sua truoc chi geometry-check khi scroll; pointer move ben ngoai list khong co listener toan cuc de dam bao preview duoc an neu child `mouseleave` bi bo lo.
- 2026-07-17: Theo yeu cau sua toi thieu, khong them `window.pointermove`; bo sung exit handler ngay tai boundary cua `lp-showcase-list` va regression test `mouseLeave(list)`.
- 2026-07-17: Da thay geometry/pointer state bang quy tac dong thong nhat: list boundary dong khi mouse leave, scroll dong ngay va kiem tra lai o RAF, tween show/hide dung `overwrite: auto`. Regression test moi do tren code cu va xanh sau sua.
- 2026-07-17: Verify lai dat 11/11 tests, typecheck, lint, production build; browser scroll xuong va len deu giu preview `opacity: 0`, `visibility: hidden`, console khong co error/warning.
- 2026-07-17: Stress-test 3/3 pass (`down-up`, `up-down`, `short-down-up`) tai hien loi doi nghich: link Talus Cap van interaction/focus nhung preview ket thuc `opacity: 0`, `visibility: hidden` vi scroll hide vo dieu kien ma khong reconcile sau idle.
- 2026-07-17: Nguoi dung phe duyet chuyen sang controller tap trung; da backup component/test va bat dau regression coverage cho scroll-idle restoration.
- 2026-07-17: Da tach `useShowcasePreview`, noi lai component va khoa 6 regression cases: restore sau scroll-idle khi van hover, khong restore khi roi hover, list leave, focus bi suppress sau scroll, rapid item switching va cleanup khi unmount.
- 2026-07-17: Verify cuoi dat 15/15 tests, typecheck, lint va production build. Browser stress-test scroll len/xuong qua Index nhieu vong va xuong han section ben duoi deu giu preview hidden ngoai tuong tac; console khong co error/warning.

## Review

_Filled in after completion._

## Learnings

- Voi noi dung cuon duoi con tro dung yen, `scroll` co the duoc xu ly truoc `mouseenter`; kiem tra dong bo trong scroll handler bo lo preview duoc bat muon trong cung frame. Xep geometry check sang RAF va doc ref ben trong callback khoa dung thu tu nay.
- Invariant "preview chi hien khi pointer nam trong list" nen duoc bao ve tai boundary cua list; chi dua vao `mouseleave` cua tung link khong du de phuc hoi neu transition event bi bo lo.
- An ngay khi scroll va an lai o RAF don gian hon geometry check: khong phu thuoc huong scroll/toa do cu, dong thoi chan `mouseenter` muon trong frame cuoi. `overwrite: auto` loai bo kha nang tween show cu ghi de tween hide.
- Hide-only khi scroll giai quyet neo anh nhung lam mat kha nang khoi phuc hover khi nguoi dung dung lai tai Index. Can tach `isScrolling` khoi pointer/focus candidate va reconcile sau scroll-idle thay vi coi hidden la trang thai ket thuc.

---

> **Agent reference — not for user review.** Everything below this line is working notes for implement-spec. Remove this section before committing.

## Implementation Notes

- `frontend/app/components/landing/ShowcaseSection.tsx`: `showPreview` hien khong cap nhat `pointer`; `handleScroll` chay dong bo va return neu `isPreviewVisible.current` con false. `mouseenter` do list troi duoi con tro co the chay sau lan kiem tra scroll cuoi cung, de preview hien ma khong con su kien tat.
- Cap nhat toa do chi tu mouse-enter/mouse-move; schedule mot geometry check bang `requestAnimationFrame` tren moi scroll (ke ca khi preview dang an), cancel frame cu neu co, doc `isPreviewVisible` ben trong callback va cleanup frame/listener khi unmount.
- Giu `onMouseLeave`/`onBlur` hien co cho cac duong thoat thong thuong.
- Regression test render component trong Router context; mock `gsap.to`, `gsap.quickTo`, `matchMedia`, `requestAnimationFrame` va bounding rect cua list. Trinh tu test: dispatch `scroll` khi preview con an, dispatch `mouseEnter` voi `clientX/clientY` cu the, doi rect de diem do nam ngoai list, chay callback RAF da xep hang, roi xac nhan tween `autoAlpha: 0`.
- Truoc implementation, copy component goc vao `backups/showcase-preview-anchor/ShowcaseSection.tsx.bak`; sau typecheck/lint/test/build va browser verify deu dat, xoa backup va thu muc backup rong.
- Controller moi dat tai `frontend/app/components/landing/useShowcasePreview.ts`; giu refs cho pointer candidate, focus candidate, visible source, scrolling va idle timer. `reconcilePreview` la noi duy nhat goi show/hide.
- Browser CUA khong tao CSS `:hover` on dinh khi chi move toa do; vi vay nhanh scroll-idle restore duoc xac nhan bang regression test co mock `matches(":hover")`, con browser verify dung de xac nhan khong neo anh, scroll hai huong va console sach.
