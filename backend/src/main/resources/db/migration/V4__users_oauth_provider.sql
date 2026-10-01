-- Đăng nhập Google (OIDC): user Google không có mật khẩu; lưu nhà cung cấp + subject

ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL;

ALTER TABLE users
  ADD COLUMN provider VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'LOCAL' AFTER password_hash,
  ADD COLUMN provider_id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER provider;

ALTER TABLE users
  ADD CONSTRAINT ck_users_provider CHECK (provider IN ('LOCAL', 'GOOGLE'));

-- provider_id NULL (tài khoản LOCAL) không vi phạm unique trong MySQL
ALTER TABLE users
  ADD UNIQUE KEY uk_users_provider_id (provider, provider_id);
