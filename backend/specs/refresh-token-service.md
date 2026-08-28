---
title: Refresh Token Service
status: brainstorming
created: 2026-08-28
updated: 2026-08-28
refs:
  specs: []
  files:
    - src/main/java/com/projectsale/api/auth/security/JwtService.java
    - src/main/java/com/projectsale/api/auth/security/JwtProperties.java
    - src/main/java/com/projectsale/api/auth/security/JwtAuthenticationFilter.java
    - src/main/java/com/projectsale/api/auth/security/RefreshTokenService.java
    - src/main/java/com/projectsale/api/auth/security/DeviceInfo.java
    - src/main/java/com/projectsale/api/auth/security/RefreshSessionView.java
    - src/main/java/com/projectsale/common/config/RedisConfig.java
    - src/main/java/com/projectsale/common/exception/ErrorCode.java
    - src/main/resources/application.yml
    - src/test/java/com/projectsale/api/auth/security/JwtServiceTest.java
    - src/test/java/com/projectsale/api/auth/security/RefreshTokenServiceTest.java
---

# Refresh Token Service

## Intent

Tạo dịch vụ refresh token dạng JWT có trạng thái phiên lưu trong Redis, cho phép một người dùng đăng nhập trên nhiều thiết bị và thu hồi độc lập từng phiên hoặc toàn bộ phiên. Rotation phải ngăn refresh token cũ được tái sử dụng và việc phân biệt access/refresh token phải được kiểm tra bắt buộc bằng claim `type`.

## Decisions

- Access token và refresh token đều là JWT HS256, nhưng có `type` riêng và đường phát hành/xác minh riêng; refresh token không được chấp nhận như access token.
- Mỗi phiên có `sessionId` (`sid`) và `deviceId`. Mỗi user chỉ có một session hoạt động cho một `deviceId`; `issue` trên cùng thiết bị sẽ thu hồi/thay thế phiên trước. Lớp gọi chịu trách nhiệm cung cấp `deviceId` ổn định từ client khi luồng login được triển khai.
- `deviceId` là định danh opaque, không chứa thông tin loại máy. Session lưu riêng metadata để nhận biết thiết bị: tên hiển thị, platform, user-agent, IP gần nhất, thời điểm tạo và lần hoạt động gần nhất.
- Tên/model chính xác như “iPhone 14” phải do native client cung cấp hoặc người dùng đặt. Trình duyệt thường chỉ xác định được nhóm thiết bị/hệ điều hành như “iPhone/iOS” hoặc “Chrome on Windows”, không đảm bảo suy ra đúng model phần cứng.
- Metadata do client cung cấp hoặc suy ra từ User-Agent/IP chỉ phục vụ hiển thị và audit; không được dùng như bằng chứng xác thực. `deviceId` cũng không phải bí mật và không thay thế refresh-token possession.
- Redis là nguồn trạng thái cho refresh session. Session lưu user ID, device ID, JTI hiện tại và thời điểm hết hạn; user-session index hỗ trợ logout-all, còn user-device mapping hỗ trợ thay thế/thu hồi đúng thiết bị mà không quét keyspace.
- Rotation là one-time: chỉ JTI hiện tại mới được đổi token. Nếu refresh token hợp lệ về chữ ký nhưng JTI đã cũ, cả session bị thu hồi để hạn chế replay.
- `revoke` thu hồi một session; `revokeAll` thu hồi mọi session của user. Access token đã phát hành vẫn sống tối đa đến `access-ttl`; kiểm tra session Redis trên mọi request access được để ngoài phạm vi hiện tại.
- `listSessions` trả danh sách phiên kèm metadata thiết bị để UI có thể hiển thị máy nào đang đăng nhập và cho phép chọn phiên cần thu hồi.
- Không lưu chuỗi JWT thô trong Redis. Redis chỉ lưu dữ liệu định danh phiên/JTI cần thiết để xác minh và thu hồi.
- Redis lỗi được xử lý fail-closed: không phát hành hoặc chấp nhận refresh token khi không thể đọc/ghi trạng thái phiên.
- Các thao tác `issue`, `rotate`, replay-revoke, `revoke` và `revokeAll` phải nguyên tử đối với session, user-session index và device mapping. `revokeAll` tuyến tính hóa tại Redis: mọi phiên tồn tại trước điểm thực thi bị xóa; một login/issue chạy sau điểm đó được xem là phiên mới hợp lệ.

## Approach

Tách trách nhiệm ký và đọc claims JWT khỏi quản lý vòng đời phiên: JWT service phát hành/xác minh đúng loại token, còn refresh-token service quản lý session, rotation và revoke trong Redis. Mỗi refresh JWT liên kết với một session và một JTI hiện hành; bản ghi session đồng thời giữ metadata mô tả để danh sách phiên có thể phân biệt iOS, Android, Windows hoặc thiết bị do người dùng đặt tên. Redis duy trì nguyên tử bản ghi session, chỉ mục theo người dùng và ánh xạ thiết bị để thu hồi một thiết bị hoặc tất cả thiết bị mà không phải quét toàn bộ Redis. Các hành vi bảo mật và cạnh tranh đồng thời sẽ được khóa bằng unit test cùng integration test Redis thật.

## Scope

**In:**

- Mở rộng JWT claims và API để phát hành/xác minh riêng access token và refresh token.
- Tạo `RefreshTokenService` gồm `issue`, `verify`, `rotate`, `revoke`, `revokeSession`, `revokeAll`, `listSessions`.
- Lưu session và user-session index trong Redis với TTL phù hợp `refresh-ttl`.
- Lưu và trả metadata thiết bị gồm `deviceId`, `displayName`, `platform`, `userAgent`, `lastIp`, `createdAt`, `lastSeenAt`.
- Cập nhật access authentication filter để chỉ chấp nhận access token.
- Unit test cho JWT type và vòng đời refresh session; integration test Redis thật cho atomicity, concurrent rotation, replay và tính nhất quán các index.

**Out:**

- Implement login, refresh, logout hoặc logout-all controller/API.
- Thay đổi schema MySQL hoặc khôi phục bảng `refresh_tokens` đã bị migration V2 xóa.
- Tự động nhận diện chính xác model phần cứng từ browser User-Agent; giới hạn số thiết bị.
- Thu hồi tức thì access token đang tồn tại; access token hết hạn tự nhiên sau 15 phút.

## Future Notes

Khi triển khai login, client cần gửi một `deviceId` ổn định cùng tên/model nếu biết và gọi `RefreshTokenService.issue`; browser client nên sinh UUID một lần rồi lưu trong persistent storage, native app nên lưu trong secure storage. Controller tương lai sẽ thu thập User-Agent và địa chỉ IP từ request sau trusted proxy rồi đóng gói thành `DeviceInfo`; service không phụ thuộc trực tiếp `HttpServletRequest`. Các endpoint refresh/logout sẽ gọi `rotate`/`revoke`; logout-all có thể gọi `revokeAll` từ danh tính access token. Nếu sau này yêu cầu logout làm access token mất hiệu lực ngay, thêm kiểm tra `sid` trong Redis ở access filter hoặc access-token denylist, có đánh giá riêng về độ trễ và hành vi khi Redis lỗi.

## Progress

Spec written, pending review.

## Review

_Filled in after completion._

## Learnings

_Filled in after completion._

---

> **Agent reference — not for user review.** Everything below this line is working notes for implement-spec. Remove this section before committing.

## Implementation Notes

- Refactor `JwtService` to expose `issueAccessToken(User, UUID sessionId)`, `issueRefreshToken(User, UUID sessionId)`, `verifyAccessToken(String)`, and `verifyRefreshToken(String)`. Shared private parsing must validate signature, algorithm, issuer, audience, expiration and expected `type`.
- Refresh claims contain `sub`, `type=REFRESH`, `sid`, `jti`, `iat`, `exp`; access claims contain `sub`, `role`, `type=ACCESS`, optional `sid`, `jti`, `iat`, `exp`.
- Prefer `Duration` for `refreshTtl` so the same fixed TTL can be used by JWT expiration and Redis. Change YAML from `P30D` to an equivalent duration if required by binding.
- Add `RefreshTokenService` under `api/auth/security` and small immutable records for Redis session/device input/session view. Suggested contracts: `IssuedRefreshToken issue(User user, DeviceInfo device)`, `VerifiedRefreshToken verify(String rawToken)`, `IssuedRefreshToken rotate(String rawToken, DeviceActivity activity)`, `void revoke(String rawToken)`, `void revokeSession(UUID userId, UUID sessionId)`, `void revokeAll(UUID userId)`, `List<RefreshSessionView> listSessions(UUID userId, UUID currentSessionId)`.
- `DeviceInfo` carries client-generated `deviceId`, optional client/user-provided `displayName` and optional platform hint; caller-captured raw `userAgent` and `ipAddress` are stored separately. Normalize lengths and treat all display metadata as untrusted text. Platform classification is a display enum such as `IOS`, `ANDROID`, `WINDOWS`, `MACOS`, `LINUX`, `OTHER`, `UNKNOWN`.
- Normalize before persistence with deterministic limits: `displayName` 120 characters, raw `userAgent` 512 characters and textual IP 45 characters. Reject a missing `deviceId`; blank optional values become null.
- Persist `createdAt` and update `lastSeenAt`/`lastIp` on successful rotation. A fallback display name may be derived conservatively from platform/browser hints (for example “Chrome on Windows”); never claim a specific hardware model unless supplied by a capable client or user.
- `RefreshSessionView` exposes only UI-safe session/device metadata, timestamps and `currentSession`; it must never expose current JTI or other Redis verification state. `listSessions` filters expired/missing records and removes stale set members encountered during listing.
- Use Redis Cluster-compatible keys sharing one user hash tag: `auth:refresh:{userId}:session:{sid}`, `auth:refresh:{userId}:sessions`, and `auth:refresh:{userId}:device:{deviceId}`. All keys touched by one script therefore remain in the same hash slot.
- Use Redis Lua scripts for every multi-key state transition. `issue` atomically revokes the prior session mapped to the device, creates the new session, updates the user set/device mapping and only then returns success so no unindexed token is returned. `rotate` atomically compares current JTI, replaces it and refreshes TTL; mismatch atomically revokes the entire session. `revoke` atomically deletes session and matching device mapping, removes set membership, and deletes an empty index. `revokeAll` atomically resolves indexed sessions and deletes their session/device keys plus the user index.
- `revokeSession(userId, sessionId)` resolves the indexed session then reuses the same atomic revoke transition as token-based `revoke`, including conditional removal of the device mapping.
- Every `issue` and successful `rotate` must refresh the user-session index TTL so it covers at least the newest live session. Device mapping TTL equals its session TTL. Revoking a session removes its device mapping only when the mapping still points to that `sid`, preventing deletion of a replacement session.
- Keep serialization explicit and stable. Avoid relying on Java native serialization. Existing `RedisTemplate<String,Object>` uses JSON values and string keys; set operations can use the same template with typed conversion or a dedicated string/hash representation.
- Add dedicated error semantics for invalid/expired/revoked/replayed refresh tokens without exposing cryptographic details.
- JWT tests must prove a refresh JWT is rejected by access verification and vice versa. Unit tests cover service result/error mapping and device metadata normalization/fallback naming. A Testcontainers/real Redis integration test covers scripts, same-device replacement, session listing metadata, concurrent rotation (exactly one success), replay session revocation, revoke consistency and revoke-all behavior; mocks alone are not considered sufficient proof of atomicity.
