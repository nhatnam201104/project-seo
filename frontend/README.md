# ProjectSale — Frontend (React Router v7, SSR)

Frontend cho website bán mắt kính **ProjectSale**. Stack chốt theo PRD:
**React + Vite + SSR**, gọi REST API Spring Boot (`/api/v1`), JWT.

> Đây là **khung nền tảng + 1 feature mẫu** (auth + catalog). Các feature còn lại
> (cart, checkout, orders, admin CMS…) build tiếp theo đúng khuôn này.

## Chạy dự án

```bash
cp .env.example .env      # điền API_BASE_URL, SESSION_SECRET...
npm install
npm run dev               # http://localhost:3000
npm run typecheck         # react-router typegen + tsc
npm run build && npm start
```

> `npm run typecheck` chạy `react-router typegen` trước để sinh types cho
> `./+types/*`. Trước khi typegen chạy, tsc sẽ báo thiếu các module này — bình thường.

## Quyết định kiến trúc cốt lõi

### 1. httpOnly session-cookie bridge (bảo mật token)

Backend trả `access_token` + `refresh_token` **trong body** (không phải httpOnly
cookie). Để **JS client không bao giờ cầm token**, server React Router lưu token
vào **session cookie httpOnly của chính nó**. Mọi call cần auth chạy **server-side**
trong loader/action.

```
Browser ──(form/nav)──▶ RR7 server ──(đọc token từ session)──▶ Spring API (Bearer)
   ▲                        │
   └──── httpOnly cookie ◀──┘  (JS không đọc được token)
```

- `app/lib/session.server.ts` — session cookie (`createCookieSessionStorage`).
- `app/lib/http.server.ts` — tạo Axios client **per-request**, gắn Bearer từ
  session, tự refresh khi 401 rồi ghi token mới vào cookie.
- `app/lib/auth.server.ts` — `requireUser`, `requireAdmin`, `createUserSession`, `logout`.

### 2. Tầng Axios (`app/core/api/`)

Không import `axios` trực tiếp trong component/route. Mọi request đi qua
`createApiClient()`. Interceptor theo thứ tự: **request** (Bearer, correlation-id)
→ **refresh** (401 single-flight, retry ≤1) → **response** (map `AxiosError → ApiError`).
Client là **factory per-request** (không singleton giữ token) để an toàn dưới SSR.

### 3. State ownership

| State                                    | Nơi ở                                    |
| ---------------------------------------- | ------------------------------------------ |
| Server data (product/order list, detail) | Route**loader** (SSR)                |
| Filter / sort / page / search            | **URL** search params                |
| Current user (hiển thị)                | Zustand`auth.store` (không persist)     |
| Access/refresh token                     | **Session cookie httpOnly** (server) |
| Theme, sidebar                           | Zustand`ui.store` (persist)              |
| Guest cart token                         | Zustand`cart-token.store` (persist)      |
| Form                                     | React Hook Form                            |

### 4. RBAC theo ROLE

Backend chỉ có `user_role` = `USER` / `ADMIN` (**không có bảng permission**,
`/me` không trả `permissions`). Nên chỉ có `hasRole`/`isAdmin` + `<RoleGate>`
(UX) và `requireRole`/`requireAdmin` (hàng rào thật ở loader). Không có
`hasPermission`.

## Cấu trúc thư mục

```
app/
├── root.tsx · routes.ts · app.css
├── core/
│   ├── config/  env.server.ts · env.client.ts
│   ├── domain/  enums.ts            # ánh xạ enum từ schema.dbml (nguồn chân lý)
│   └── api/     axios-instance · api-client · api-error · api-response · interceptors/
├── lib/         session.server · http.server · auth.server · rbac · format
├── stores/      auth · ui · cart-token · notification · safe-storage
├── components/  rbac/RoleGate
├── features/
│   ├── auth/     api/ (auth.api · auth.endpoints · auth.types)
│   └── catalog/  api/ (product.*) · services/product.service
└── routes/      home · login · logout · account · admin
```

## Quy ước đặt tên API (bám đúng contract — KHÔNG đồng nhất hoá)

- **Body JSON** = `snake_case` (`full_name`, `order_code`, `variant_id`…).
- **Query params** = `camelCase` (`categoryId`, `minPrice`…) + Spring `page/size/sort`.
- Phân trang trả `Page<T>` = `{ content, totalElements, totalPages, number, size }`
  (`number` là chỉ số trang, **0-indexed**).

## Điểm cần backend xác nhận (TODO)

- Filter `gender` / `hasLens` / `faceTag` đã có trong PostgreSQL backend; UI có thể
  kích hoạt khi thiết kế màn lọc hoàn tất.
- **R2**: shape lỗi validate 400 (`fieldErrors`?) — hiện `ApiError` để optional.
- **R7**: ai sinh `X-Cart-Token` và vòng đời của nó.
