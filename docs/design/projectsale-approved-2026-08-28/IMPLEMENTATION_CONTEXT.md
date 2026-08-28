# Implementation context

Status: implementing

## Objective

Implement the approved PROJECTSALE storefront design while preserving the
existing landing-page art direction and the current server-side authentication
flow. This handoff covers the global client header, login, register,
authenticated header/account menu, category mega-menu, and account overview.

## Approved visual system

- Brand direction: premium fashion/editorial eyewear; high-contrast black,
  white, and off-white; restrained rules; full-bleed campaign photography.
- Headline, wordmark, navigation: **Inter Tight** with Helvetica Neue/Arial
  fallback; bold or extra-bold.
- Functional UI/body: **Inter** in regular, medium, and semibold weights.
- Metadata only: **IBM Plex Mono**, used sparingly for order IDs, timestamps,
  and small collection labels. Do not use monospace for forms, buttons,
  navigation, or paragraphs.
- Avoid rounded SaaS styling, gradients, pastel palettes, decorative fonts,
  and cell-by-cell boxed navigation.
- Desktop reference width: approximately 1440px. Mobile reference width:
  approximately 390px.
- Accessibility: WCAG AA contrast, visible keyboard focus, semantic labels,
  clear errors, and 44px minimum interactive targets.

## Header decisions

### Guest state

- Order/contents: `PROJECTSALE`, `PRODUCT`, `CATEGORY`, `ABOUT`, search,
  `LOGIN`, `CART (0)`.
- Use a light/translucent white surface over the hero and at most one subtle
  bottom hairline.
- No vertical borders or boxed cells around individual navigation items.
- Hover/active feedback comes from opacity, underline, or restrained icon hit
  areas, not heavy containers.
- Preserve the homepage hero composition and the `NHÌN RÕ. ĐÚNG GU.` message.

### Authenticated state

- Replace `LOGIN` with a compact account trigger such as `NAM / ACCOUNT` or a
  person icon plus the user's display name.
- Account menu items: Account overview, My orders, Saved items, Addresses,
  Log out.
- The menu is an off-white lightweight panel with subtle shadow and at most one
  outer rule. Do not border every row.
- Keep search and cart available in both guest and authenticated states.

### Category state

- Full-width mega-menu directly below the header with generous whitespace.
- Columns:
  - Eyeglasses: Acetate, Titanium, Metal.
  - Sunglasses: Classic, Sport, Polarized.
  - Lenses: Blue-light, Prescription, Photochromic.
  - Discover: New arrivals, Best sellers, Face-shape guide.
- Include one featured campaign/collection tile on the right.
- Use subtle outer shadow/bottom rule only; no border around each link.
- Implement open, close, hover, active, keyboard focus, Escape, and outside-click behavior.

## Authentication decisions

- Login and Register use the same split-screen editorial shell and one shared
  reusable field component.
- The Login field is the source of truth for all Register fields.
- Final input treatment is underline-only:
  - transparent/off-white background;
  - no top, left, or right border;
  - no shadow and zero border radius;
  - default 1px neutral bottom border;
  - hover/focus 2px black bottom border;
  - error uses a red bottom border and short message below;
  - disabled uses a light-gray bottom border;
  - target field height 52-56px;
  - labels sit above the field;
  - password visibility control stays at the right edge without breaking the underline.
- Login fields: email and password; remember-me, forgot-password, primary login,
  restrained Google sign-in, and Register link.
- Register fields: full name, email, optional phone, password, confirm password;
  terms checkbox, create-account, restrained Google sign-in, and Login link.
- Preserve server-rendered validation and accessible error announcements.

## Account overview decisions

- Global header remains visually consistent with the authenticated homepage.
- Main account region starts **64px below the header** on desktop.
- Sidebar navigation and `WELCOME, NAM.` begin on the same visual baseline.
- Use container top padding rather than an arbitrary empty strip.
- Sidebar items: Overview, Orders, Saved items, Settings, Logout.
- Content: profile summary, Edit profile, Change password, saved-item count,
  recent orders/status, and default shipping address.
- Do not box the sidebar navigation.

## Existing implementation map

Relevant frontend files at handoff time:

- `frontend/app/components/layout/client/ClientHeader.tsx`: current minimal guest/authenticated header.
- `frontend/app/components/layout/layout.css`: current client shell and header styles.
- `frontend/app/components/landing/SiteHeader.tsx`: landing-specific editorial header.
- `frontend/app/components/landing/MenuOverlay.tsx`: existing landing menu behavior/reference.
- `frontend/app/routes/login.tsx`: working SSR login loader/action, currently minimal inline UI.
- `frontend/app/routes/account.tsx`: protected account loader and minimal profile UI.
- `frontend/app/routes.ts`: `/login` and `/account` exist; no `/register` route yet.
- `frontend/app/features/auth/api/auth.api.ts`: `login`, `register`, `refresh`, `logout`, and `getMe` are implemented.
- `frontend/app/features/auth/api/auth.types.ts`: `RegisterRequest` already supports `email`, `password`, `full_name`, and optional `phone`.
- `frontend/app/layouts/client-layout.tsx`: shared client shell and source of authenticated user context.

Current backend/session behavior to preserve:

- Login action uses the public API, fetches `/me` when required, then creates an
  httpOnly server session.
- Protected account loader uses `requireUser()` and commits refreshed tokens.
- Tokens must not be moved into the client bundle or browser storage.

## Suggested implementation sequence

1. Introduce storefront design tokens/fonts and a reusable underline field.
2. Refactor the client header into guest/authenticated states with responsive search, cart, and category controls.
3. Implement the accessible category mega-menu and account popover.
4. Restyle `/login` without changing its loader/action contract.
5. Add `/register` using the existing `authApi.register` and server-session pattern.
6. Rebuild `/account` with the 64px content offset and responsive account navigation.
7. Add component/route tests for keyboard behavior, validation, auth state, and responsive rendering.
8. Visually compare implementation against the HTML exports and Stitch project at desktop/mobile breakpoints.

## Definition of done

- All six approved screen states are represented in the application.
- Login/Register fields share one component and match the underline-only specification.
- Header has no boxed per-item borders.
- Guest/authenticated/category/account-menu states work with keyboard and pointer.
- Account navigation starts 64px below the header and aligns with the welcome block.
- Existing authentication/session tests continue to pass.
- New UI tests cover the register route, menus, form errors, and authenticated header.
- Desktop and mobile visual comparison is completed before handoff.

## Progress

- 2026-08-28 — Re-read the approved design package, confirmed the six target states, and started frontend implementation.
- 2026-08-28 — Implemented the shared storefront header, guest/authenticated controls, category mega-menu, search overlay, Login/Register underline fields, and Account Overview.
- 2026-08-28 — Completed desktop (1440px) and mobile (390px) visual comparison for the homepage, category menu, Login, and Register; verified the authenticated states through component tests.
- 2026-08-28 — Refined mobile Login/Register titles to a shared 50.75px centered scale after visual review.

## Learnings

- The exported Stitch HTML is a visual reference only; production code must preserve the existing React Router SSR session flow and project conventions.
- Reusing one header and one auth field component keeps the landing page and SSR client routes visually consistent without moving tokens into client storage.
