-- Hồ sơ người dùng: ngày sinh, giới tính, ảnh đại diện (upload ảnh chưa làm, chỉ có cột).
-- Đăng ký / đăng nhập Google không nhập các trường này nên mọi cột đều có giá trị mặc định:
--   date_of_birth, avatar_url: chưa có giá trị hợp lý để mặc định → NULL
--   gender: 'OTHER' (chưa xác định), người dùng tự đổi ở trang Edit profile

ALTER TABLE users
  ADD COLUMN date_of_birth DATE NULL DEFAULT NULL AFTER phone,
  ADD COLUMN gender VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'OTHER' AFTER date_of_birth,
  ADD COLUMN avatar_url VARCHAR(255) NULL DEFAULT NULL AFTER gender;

ALTER TABLE users
  ADD CONSTRAINT ck_users_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'));

-- Phục vụ tải danh sách địa chỉ của một user (địa chỉ mặc định lên đầu)
ALTER TABLE addresses
  ADD KEY ix_addresses_user (user_id, is_default);
