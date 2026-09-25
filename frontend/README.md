# ProjectSale — Frontend (React Router v7, SSR)

Frontend cho website bán mắt kính **ProjectSale**. Stack chốt theo PRD:
**React + Vite + SSR**, gọi REST API Spring Boot (`/api/v1`), JWT.

Auth đã kết nối theo `AuthController` của backend; catalog là feature mẫu.
Các trang admin hiện vẫn là prototype dùng dữ liệu mock.

## Chạy dự án

```bash
cp .env.example .env      # điền API_BASE_URL, SESSION_SECRET...
npm install
npm run dev               # http://localhost:5173
npm run typecheck         # react-router typegen + tsc
npm run build && npm start
```

> `npm run typecheck` chạy `react-router typegen` trước để sinh types cho
> `./+types/*`. Trước khi typegen chạy, tsc sẽ báo thiếu các module này — bình thường.

### Deploy production: IP thật của người dùng

Trình duyệt không gọi API trực tiếp — mọi request đi qua server SSR này, nên
backend chỉ thấy **một** IP. Để rate limit tính theo từng người dùng:

1. `npm start` chạy `server.js` (thay `react-router-serve`): đưa IP trình duyệt
   vào `context.clientIp`, loader chuyển tiếp cho API qua `X-Forwarded-For` và
   `X-Forwarded-User-Agent`.
2. Đặt **cùng một** `INTERNAL_PROXY_SECRET` (>= 32 ký tự, `openssl rand -base64 48`)
   ở `frontend/.env` và `backend/.env`. Backend chỉ tin các header trên khi bí mật
   khớp; app từ chối khởi động ở production nếu thiếu.
3. `TRUST_PROXY_HOPS` = số reverse proxy đứng trước Node (nginx/LB = 1, chạy trực
   tiếp = 0). Đặt cao hơn thực tế sẽ cho client tự khai IP. **Đặt thấp hơn thực tế
   (vd: quên đổi khỏi 0 khi đặt sau LB) hỏng âm thầm** — không có lỗi nào, nhưng mọi
   người dùng lại mang IP của LB và dùng chung rate limit. Sau mỗi lần deploy, kiểm
   tra `lastIp` của một session trong Redis (`auth:refresh:{userId}:session:*`) phải là
   IP trình duyệt, không phải IP của LB.
4. Phòng thủ nhiều lớp: không mở cổng API Spring ra internet — chỉ server SSR gọi vào.

`npm run dev` không có `clientIp` (không qua `server.js`); mọi request dev dùng
chung IP localhost, chấp nhận được khi phát triển.

## Auth: API, DTO và validation

`API_BASE_URL=http://localhost:8081/api/v1` khớp cổng mặc định trong
`backend/src/main/resources/application.yml`. Backend cần database, Redis và
cấu hình mail để đăng ký/gửi OTP thực tế. Frontend gọi backend qua SSR;
không đưa token vào localStorage hoặc dữ liệu trả về trình duyệt.

| API (POST, sau `/api/v1`) | Luồng frontend |
| --- | --- |
| `/auth/register` | `/register` → nhận `data: null`, chuyển `/verify` |
| `/auth/verify` | Xác thực OTP → tạo session → `/account` hoặc đích nội bộ |
| `/auth/resendOTP` | Gửi lại OTP, hiển thị thời gian chờ |
| `/auth/login` | Tạo session nếu ACTIVE; đúng mật khẩu và PENDING → `/verify`, không gửi mail |
| `/auth/me` | Xác minh người dùng trong `requireUser` và tải tài khoản |
| `/auth/refresh` | Tự xoay hai token khi nhận 401, retry tối đa một lần |
| `/auth/logout` | Thu hồi refresh token của đúng thiết bị, xóa cookie |

- `app/features/auth/validation/auth.schema.ts`: Zod dùng chung ở client/server;
  DTO TypeScript suy ra từ schema. Kiểm tra cả payload phản hồi auth.
- `app/features/auth/hooks/useAuthForm.ts`: quản lý trường bằng React Hook Form,
  kiểm tra Zod, focus lỗi đầu tiên và submit qua React Router.
- Đăng ký: email tối đa 190, họ tên tối đa 120, mật khẩu 8–72 ký tự,
  số điện thoại bắt buộc khớp `^(0|\+84)(3|5|7|8|9)\d{8}$`;
  xác nhận mật khẩu và đồng ý điều khoản được kiểm tra trước khi gọi API.
- OTP gồm 6 chữ số, giữ số 0 đầu; backend phát mã có thời hạn 5 phút.
- Đăng nhập/đăng ký không còn liên kết xác thực riêng. Trang `/verify` chỉ nhập
  OTP và hiển thị email che bớt; action lấy email từ cookie, không từ form/URL.
- `app/features/auth/services/pending-verification.server.ts` quản lý cookie
  `__ps_pending_verification`: ký, httpOnly, SameSite=Lax và Secure theo cấu hình.
  Không dùng localStorage. Cookie giữ email, flowId, nguồn luồng, đích điều hướng,
  lựa chọn ghi nhớ và thời hạn tuyệt đối 15 phút; đây không phải session đăng nhập.
  Chữ ký chống sửa dữ liệu, không mã hóa nội dung cookie.
- Đăng ký thành công tạo phiên chờ (backend đã gửi OTP). Đăng nhập nhận đúng
  `403 + "Account not verified"` chỉ tạo phiên chờ, không gửi email. Đăng ký lại
  thất bại không tạo phiên chờ; người dùng được hướng về đăng nhập.
- Chỉ nút “Gửi lại mã” gọi `/auth/resendOTP`. Gửi thành công xóa mã đang nhập;
  mốc chờ gửi lại được lưu cookie để giữ qua reload. 429 không ngăn nhập mã cũ.
  Reload và loader không gửi email. Cookie chờ không được kéo dài bởi thao tác gửi lại.
- Xác thực thành công khôi phục `remember`/`redirectTo` và xóa cookie chờ.
  Đăng nhập thành công, đăng xuất hoặc hủy bằng POST cũng xóa cookie này.
  Thiếu/hỏng/hết phiên chuyển về đăng nhập; flowId không khớp yêu cầu tải lại,
  tránh tab cũ gửi mã hoặc hủy luồng mới ở tab khác.
- `deviceId` UUID được tạo server-side và lưu cookie ký, httpOnly;
  `deviceId`, `deviceName`, `platform` dùng camelCase đúng DTO backend.
- Session giữ `deviceId` cùng token. “Ghi nhớ tôi” tạo cookie 7 ngày;
  nếu không chọn thì cookie theo phiên trình duyệt. Refresh giữ lựa chọn này.
- Lỗi validation backend (`error.detailMessage`) được ánh xạ về từng trường;
  lỗi nghiệp vụ và 429 có thông báo, trạng thái chờ và xử lý gửi lại.
- Refresh bị từ chối: xóa phiên, chuyển đăng nhập. Backend tạm lỗi: giữ phiên
  để có thể thử lại. Đăng xuất vẫn xóa cookie nếu backend không phản hồi.
- Chưa có API Google login/khôi phục mật khẩu trong backend hiện tại.
  Các trang admin mock chưa nối API dữ liệu và vẫn giữ chế độ preview công khai.

Kiểm tra: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
Test auth nằm ở `test/features/auth/` và `test/lib/auth-session.test.ts`;
test session dùng HTTP server cục bộ để kiểm tra xoay token và thu hồi phiên.

## Landing page eyewear (`/`)

Trang chủ là landing page editorial của ProjectSale (GSAP + ScrollTrigger + Lenis),
giới thiệu gọng kính, kính râm và tròng kính theo định hướng PRD. Motion system
gốc được ghi lại tại [`specs/landing-campaign-video-analysis.md`](../specs/landing-campaign-video-analysis.md),
còn quyết định chuyển nội dung sang eyewear nằm ở
[`specs/landing-eyewear-content-refresh.md`](../specs/landing-eyewear-content-refresh.md).

- Code: `app/components/landing/` (mỗi section 1 component, style ở `landing.css`).
- **Đổi nội dung/ảnh/sản phẩm**: ưu tiên registry `app/components/landing/content.ts`;
  tiêu đề hero và metadata route nằm ở component/route tương ứng.
- **Tinh chỉnh animation**: hằng số duration/easing/breakpoint ở `app/lib/animation.ts`.
- Ảnh + font self-host ở `public/landing/` (nguồn + giấy phép: `public/landing/CREDITS.md`).
- Danh sách sản phẩm chuyển sang route `/products`.
- Landing **không phụ thuộc backend** (không loader) — luôn chạy được khi API tắt.

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

- **Body JSON** thường dùng `snake_case` (`full_name`, `order_code`, `variant_id`…);
  auth dùng `deviceId`, `deviceName`, `platform` theo DTO Java.
- **Query params** = `camelCase` (`categoryId`, `minPrice`…) + Spring `page/size/sort`.
- Phân trang trả `Page<T>` = `{ content, totalElements, totalPages, number, size }`
  (`number` là chỉ số trang, **0-indexed**).

## Điểm cần backend xác nhận (TODO)

- Filter `gender` / `hasLens` / `faceTag` đã có trong PostgreSQL backend; UI có thể
  kích hoạt khi thiết kế màn lọc hoàn tất.
- Lỗi validate auth 400 dùng `error.detailMessage` dạng `field: message; ...`.
- **R7**: ai sinh `X-Cart-Token` và vòng đời của nó.
