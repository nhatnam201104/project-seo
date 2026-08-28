# PROJECTSALE approved storefront design

Status: **Approved for implementation**  
Approved on: **2026-08-28**  
Stitch project: <https://stitch.withgoogle.com/projects/2857506753355085369>

This folder is the design handoff for the PROJECTSALE storefront header,
authentication flow, category navigation, and authenticated account overview.
Only the final approved screen variants are listed below. Earlier Stitch
iterations are intentionally excluded from the implementation scope.

## Approved screens

| Screen | Stitch screen name | Export |
| --- | --- | --- |
| Guest homepage header | `PROJECTSALE - Homepage Header Refined v2` | `exports/homepage-header-guest.html` |
| Authenticated homepage/header and account menu | `PROJECTSALE - Homepage Logged In Refined v2` | `exports/homepage-header-authenticated.html` |
| Category open state | `PROJECTSALE - Category Mega Menu Refined v2` | `exports/category-mega-menu.html` |
| Login | `PROJECTSALE - Login Refined v3 (Underline)` | `exports/login.html` |
| Register | `PROJECTSALE - Register Refined v3 (Underline)` | `exports/register.html` |
| Account overview | `PROJECTSALE - Account Overview Refined v3 (Spaced)` | `exports/account-overview.html` |

## Package contents

- `IMPLEMENTATION_CONTEXT.md`: decisions, flows, current code map, and the next implementation sequence.
- `screen-manifest.json`: machine-readable approved-screen manifest.
- `exports/*.html`: standalone HTML exported from each approved Stitch screen's `srcdoc`.
- `exports/stitch-canvas-overview.png`: canvas snapshot at handoff time.

## Export caveat

The exported HTML is a visual reference, not production code. It may contain
Tailwind CDN scripts, Google Fonts links, generated image URLs, and Stitch-only
markup. Rebuild the UI in the existing React Router application, reuse the
project's API/session layer, and translate the visual decisions into project
components and CSS rather than copying the export wholesale.

