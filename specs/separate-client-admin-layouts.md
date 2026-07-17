---
title: Separate client and admin layout shells
status: implementing
created: 2026-07-17
updated: 2026-07-17
refs:
  specs:
    - specs/landing-campaign-video-analysis.md
    - specs/landing-eyewear-content-refresh.md
    - specs/increase-landing-header-size.md
  files:
    - frontend/app/routes.ts
    - frontend/app/root.tsx
    - frontend/app/routes/products.tsx
    - frontend/app/routes/account.tsx
    - frontend/app/routes/login.tsx
    - frontend/app/routes/admin.tsx
---

# Separate client and admin layout shells

## Intent

Tach header va footer thanh cac component rieng cho khu vuc client va admin, sau do de layout cua tung khu vuc tu dong nap dung shell quanh noi dung route. Muc tieu la loai bo header viet inline trong page, tao ranh gioi UI ro rang va giup cac trang moi ke thua navigation nhat quan ma khong lap code.

## Decisions

- Tao mot `MainLayout` dung chung chi chiu trach nhiem ghep header, noi dung route va footer; noi dung/permission cua client va admin van nam trong `ClientLayout` va `AdminLayout` rieng.
- Moi khu vuc co cap component rieng: `ClientHeader`/`ClientFooter` va `AdminHeader`/`AdminFooter`; khong dung mot component voi nhieu nhanh role de tranh tron navigation va style.
- Dung nested layout routes cua React Router thay vi goi layout thu cong trong tung page.
- Client layout bao quanh `/products`, `/login` va `/account`. Route `/logout` giu ngoai layout vi chi la action/redirect, khong render UI.
- Admin layout bao quanh `/admin` va dung `requireAdmin` de nap thong tin user cho shell, nhung moi leaf loader co du lieu dac quyen van phai tu goi `requireAdmin`. React Router chay cac matched loader song song, nen layout redirect khong duoc xem la security boundary duy nhat.
- Bo `RoleGate` du thua khoi noi dung trang admin sau khi leaf loader da xac thuc; render tu authenticated route data de SSR khong hien fallback sai truoc khi Zustand duoc dong bo bang `useEffect`.
- Landing `/` tam thoi giu campaign shell rieng (`SiteHeader`, menu overlay va footer trong final scene), vi no co motion/CSS namespace va anchor navigation dac thu. Khong ep landing vao client shell trong dot refactor nay de tranh hai header/footer va thay doi art direction.
- Di chuyen header inline cua trang products vao `ClientHeader`; cac page chi con noi dung chinh. Footer moi dung noi dung toi thieu, lien ket noi bo da xac thuc, khong tu tao dia chi/social/contact.
- Tang typography cua client header dung `5px` so voi UI products hien tai: brand `22px` thanh `27px`, navigation/action tu co chu mac dinh `16px` thanh `21px`; cac link va nut trong header co padding click target ro rang. Admin header khong ap dung muc tang nay.
- Truoc khi sua/move file hien co, tao backup co pham vi hep; xoa backup sau khi test, build va visual verification dat.

## Approach

Them mot shell layout dung chung, sau do tao hai layout route rieng cho client va admin de moi layout nap header/footer tuong ung quanh `<Outlet />`. Chuyen navigation va auth controls dang nam trong trang products sang client header; admin layout nap user cho shell, trong khi moi privileged leaf loader van giu server authorization rieng vi cac loader chay song song. Trang admin render tu route data da xac thuc thay vi Zustand-only role gate de SSR nhat quan. Cap nhat route tree thanh nested layouts ma khong doi URL hien tai; landing campaign tiep tuc dung shell dac thu trong dot nay, sau do kiem tra SSR, navigation, access control va responsive o ca client lan admin.

## Scope

**In:** shared main shell; client/admin route layouts; four header/footer components; nested route configuration; relocation of products header; admin shell authentication plus retained leaf authorization; removal of redundant `RoleGate` and duplicated page-level navigation; layout styling and tests; desktop/mobile visual verification.

**Out:** redesign landing campaign shell; catalog/admin feature implementation; backend/API changes; new routes; invented social/contact links; changing URL paths; implementing the superseded header-size adjustment.

## Progress

Da khao sat route tree, root document layout, auth loaders va cac header/footer hien tai; spec da duoc duyet.

- 2026-07-17: Bat dau implementation. Bo sung yeu cau client header tang 5px (brand 27px, navigation/action 21px) va padding cho cac nut/link.
- 2026-07-17: Da tao backup 5 route file; tao `MainLayout`, client/admin header-footer, hai nested layout boundaries va stylesheet rieng. Da chuyen products/login/account/admin sang noi dung route khong lap shell; landing va asset dang sua cua nguoi dung khong bi cham toi.
- 2026-07-17: Verification dat 18/18 tests, lint, typecheck va production build. Browser pass dat desktop 1280px va mobile 390px: client brand 27px, action 21px, padding 10px 14px, khong horizontal overflow; landing khong co shell lap, admin guest redirect dung ve login va console khong co warning/error.

## Review

_Filled in after completion._

## Learnings

_Filled in after completion._

- React Router `<Form>` dung `useSubmit`, nen component test co auth actions phai render bang data router (`createMemoryRouter` + `RouterProvider`), khong chi `MemoryRouter`.
- Client shell co the doc auth SSR tu root loader bang `useRouteLoaderData("root")`, giup bo lan `getAuth` trung lap trong products loader ma van render dung navigation ngay tu server.

---

> **Agent reference — not for user review.** Everything below this line is working notes for implement-spec. Remove this section before committing.

## Implementation Notes

- Tao thu muc ro rang, du kien `frontend/app/components/layout/` cho `MainLayout.tsx`, `client/ClientHeader.tsx`, `client/ClientFooter.tsx`, `admin/AdminHeader.tsx`, `admin/AdminFooter.tsx`; dat route boundaries trong `frontend/app/layouts/`.
- `frontend/app/routes.ts` ho tro `layout()` tu `@react-router/dev/routes`; giu `index("routes/landing.tsx")` va resource route logout ngoai nested UI layouts.
- `root.tsx` van la document/auth-store boundary, khong dat client/admin UI vao root vi root bao quanh ca hai khu vuc.
- Client layout nen doc user SSR tu root loader bang `useRouteLoaderData("root")` de khong goi lai `getAuth(request)`; `products.tsx` co the loai bo auth read trung lap sau khi header khong con phu thuoc page loader.
- Admin layout loader dung `requireAdmin(request)` de cung cap user cho `AdminHeader`, nhung giu `requireAdmin` trong `admin.tsx` va moi privileged leaf loader tuong lai. Matched loaders chay song song, nen parent layout loader khong duoc coi la authorization barrier cho child data work.
- `admin.tsx` render noi dung tu authenticated loader data va bo `RoleGate` dang doc Zustand; server loader moi la guard, tranh SSR fallback sai truoc khi root `useEffect` dong bo store.
- Chuyen style inline cua header products sang class CSS trong stylesheet layout rieng; khong format/rewrite `app.css` neu khong can.
- Client header baseline lay tu products hien tai: heading `22px`, link/button mac dinh `16px`; dat brand `27px`, navigation/action `21px`, padding toi thieu `10px 14px`, sau do kiem tra mobile de tranh overflow.
- Viet test cho shell composition/navigation va server loader guard phu hop voi test conventions hien co; chay `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Render it nhat `/products`, `/account`, `/admin` o desktop va mobile; xac nhan landing `/` khong thay doi va khong bi them shell lan hai.
- Cac file landing va `landing.css` dang co thay doi chua commit cua nguoi dung; khong sua trong dot refactor nay.
