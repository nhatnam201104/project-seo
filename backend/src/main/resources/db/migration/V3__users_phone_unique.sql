-- Refactor: phone phải duy nhất (nullable vẫn cho phép nhiều NULL trong MySQL)

ALTER TABLE users
  ADD UNIQUE KEY uk_users_phone (phone);