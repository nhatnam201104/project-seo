-- Refactor: bỏ bảng refresh_tokens, đổi default status của users sang PENDING

DROP TABLE IF EXISTS refresh_tokens;

ALTER TABLE users
  DROP CONSTRAINT ck_users_status;

ALTER TABLE users
  MODIFY COLUMN status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'PENDING';

ALTER TABLE users
  ADD CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'UNACTIVE', 'PENDING'));
