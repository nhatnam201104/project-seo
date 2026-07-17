---
title: Increase landing header size slightly
status: superseded
created: 2026-07-17
updated: 2026-07-17
refs:
  specs:
    - specs/landing-campaign-video-analysis.md
    - specs/landing-eyewear-content-refresh.md
  files:
    - frontend/app/components/landing/landing.css
---

# Increase landing header size slightly

## Intent

Lam header cua landing page de doc hon bang cach tang nhe kich thuoc chu, nhung van giu nguyen phong cach tab mong va bo cuc hien tai. Thay doi phai khong lam header xuong dong hoac va cham voi nut menu tren man hinh nho.

## Decisions

- Chi tang token typography dung chung cho cac tab header, khong thay doi component, khoang cach, chieu cao nut menu hay cau truc navigation.
- Muc tang se nhe, tu `11.5px` len `12px`, de cai thien do doc ma van nam trong khoang 11-12px cua art direction goc.
- Can kiem tra lai desktop va mobile 390px vi cac nhan navigation da duoc rut gon de giu header tren mot hang.
- Truoc khi sua CSS hien co, tao backup co pham vi hep; xoa backup sau khi verification dat theo quy uoc du an.

## Approach

Tang nhe kich thuoc chu cua cac tab header thong qua token typography san co, de tat ca muc logo, dong ho va navigation thay doi dong bo ma khong chen them override. Sau do render landing page o desktop va mobile de xac nhan header van can doi, khong wrap va khong che noi dung. Chay cac kiem tra frontend lien quan de dam bao thay doi khong gay regression.

## Scope

**In:** font size cua cac tab header landing; visual verification desktop va mobile 390px; frontend checks lien quan.

**Out:** thay doi padding, chieu cao header, menu overlay, nut menu, noi dung navigation, typography cua cac section khac.

## Progress

Da xac dinh header dung token `--lp-text-nav` trong landing stylesheet. Yeu cau nay da duoc thay the boi `specs/separate-client-admin-layouts.md`, vi nguoi dung chuyen pham vi sang tach header/footer va layout client/admin; chua co thay doi CSS nao duoc trien khai tu spec nay.

## Review

_Filled in after completion._

## Learnings

_Filled in after completion._

---

> **Agent reference — not for user review.** Everything below this line is working notes for implement-spec. Remove this section before committing.

## Implementation Notes

- Doi `--lp-text-nav` trong `frontend/app/components/landing/landing.css` tu `11.5px` thanh `12px`.
- File CSS dang co thay doi chua commit cua nguoi dung; chi patch dung dong token va khong format/rewrite file.
- Tao backup rieng cho `landing.css` truoc khi patch; xoa backup sau khi test va browser verification dat.
