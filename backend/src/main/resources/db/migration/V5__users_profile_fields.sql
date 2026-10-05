-- Hồ sơ người dùng: ngày sinh, giới tính, ảnh đại diện (upload ảnh chưa làm, chỉ có cột)

ALTER TABLE users
  ADD COLUMN date_of_birth DATE NULL AFTER phone,
  ADD COLUMN gender VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER date_of_birth,
  ADD COLUMN avatar_url VARCHAR(255) NULL AFTER gender;

ALTER TABLE users
  ADD CONSTRAINT ck_users_gender CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER'));

-- Phục vụ tải danh sách địa chỉ của một user (địa chỉ mặc định lên đầu)
ALTER TABLE addresses
  ADD KEY ix_addresses_user (user_id, is_default);
