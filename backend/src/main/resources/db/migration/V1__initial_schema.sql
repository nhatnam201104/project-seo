CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  email VARCHAR(190) COLLATE utf8mb4_0900_as_cs NOT NULL,
  password_hash VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  full_name VARCHAR(120),
  phone VARCHAR(20),
  role VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'USER',
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6),
  deleted_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_public_id (public_id),
  UNIQUE KEY uk_users_email (email),
  CONSTRAINT ck_users_role CHECK (role IN ('USER', 'ADMIN')),
  CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE refresh_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  token_family_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6),
  replaced_by_token_id BIGINT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_used_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_tokens_public_id (public_id),
  UNIQUE KEY uk_refresh_tokens_hash (token_hash),
  UNIQUE KEY uk_refresh_tokens_replacement (replaced_by_token_id),
  KEY ix_refresh_tokens_user_expires (user_id, expires_at),
  KEY ix_refresh_tokens_family (token_family_id),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_refresh_tokens_replacement FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE addresses (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT NOT NULL,
  receiver_name VARCHAR(120) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  line VARCHAR(255) NOT NULL,
  ward VARCHAR(120),
  district VARCHAR(120),
  city VARCHAR(120) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  UNIQUE KEY uk_addresses_public_id (public_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  parent_id BIGINT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(150) COLLATE utf8mb4_0900_as_cs NOT NULL,
  image_url VARCHAR(255),
  meta_title VARCHAR(160),
  meta_description VARCHAR(255),
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_categories_public_id (public_id),
  UNIQUE KEY uk_categories_slug (slug),
  KEY ix_categories_parent (parent_id),
  CONSTRAINT ck_categories_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE brands (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(150) COLLATE utf8mb4_0900_as_cs NOT NULL,
  logo_url VARCHAR(255),
  info TEXT,
  meta_title VARCHAR(160),
  meta_description VARCHAR(255),
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ACTIVE',
  deleted_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_brands_public_id (public_id),
  UNIQUE KEY uk_brands_slug (slug),
  CONSTRAINT ck_brands_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE products (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  category_id BIGINT NOT NULL,
  brand_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) COLLATE utf8mb4_0900_as_cs NOT NULL,
  description TEXT,
  min_price DECIMAL(12,2),
  thumbnail_url VARCHAR(255),
  rating_avg DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  warranty_months INTEGER DEFAULT 0,
  meta_title VARCHAR(160),
  meta_description VARCHAR(255),
  og_image VARCHAR(255),
  gender VARCHAR(32),
  has_lens BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6),
  deleted_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_public_id (public_id),
  UNIQUE KEY uk_products_slug (slug),
  KEY ix_products_category (category_id),
  KEY ix_products_brand (brand_id),
  KEY ix_products_status_created (status, created_at DESC),
  KEY ix_products_status_price (status, min_price),
  FULLTEXT KEY ix_products_search (name, description),
  CONSTRAINT ck_products_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_face_tags (
  product_id BIGINT NOT NULL,
  tag_order INTEGER NOT NULL,
  face_tag VARCHAR(32) NOT NULL,
  PRIMARY KEY (product_id, tag_order),
  UNIQUE KEY uk_product_face_tags_value (product_id, face_tag),
  KEY ix_product_face_tags_value (face_tag, product_id),
  CONSTRAINT fk_product_face_tags_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_variants (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  product_id BIGINT NOT NULL,
  sku VARCHAR(64) COLLATE utf8mb4_0900_as_cs NOT NULL,
  color VARCHAR(60),
  size VARCHAR(30),
  material VARCHAR(60),
  lens_option VARCHAR(60),
  price DECIMAL(12,2) NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  deleted_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_variants_public_id (public_id),
  UNIQUE KEY uk_product_variants_sku (sku),
  KEY ix_variants_product (product_id),
  CONSTRAINT ck_product_variants_price CHECK (price >= 0),
  CONSTRAINT ck_product_variants_stock CHECK (stock_qty >= 0),
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_images (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  product_id BIGINT NOT NULL,
  url VARCHAR(255) NOT NULL,
  alt VARCHAR(160),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_images_public_id (public_id),
  KEY ix_images_product (product_id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE carts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT NOT NULL,
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_carts_public_id (public_id),
  UNIQUE KEY uk_carts_user (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cart_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  cart_id BIGINT NOT NULL,
  variant_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_items_public_id (public_id),
  UNIQUE KEY uk_cart_items_cart_variant (cart_id, variant_id),
  CONSTRAINT ck_cart_items_quantity CHECK (quantity > 0),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE promotions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  code VARCHAR(40) COLLATE utf8mb4_0900_as_cs NOT NULL,
  name VARCHAR(150),
  type VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  min_value DECIMAL(12,2) DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  start_at DATETIME(6),
  end_at DATETIME(6),
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (id),
  UNIQUE KEY uk_promotions_public_id (public_id),
  UNIQUE KEY uk_promotions_code (code),
  CONSTRAINT ck_promotions_type CHECK (type IN ('PERCENT', 'AMOUNT')),
  CONSTRAINT ck_promotions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE orders (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT NOT NULL,
  order_code VARCHAR(30) COLLATE utf8mb4_0900_as_cs NOT NULL,
  promotion_id BIGINT,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  shipping_address VARCHAR(500) NOT NULL,
  receiver_name VARCHAR(120),
  receiver_phone VARCHAR(20),
  tracking_code VARCHAR(60) COLLATE utf8mb4_0900_as_cs,
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'PENDING',
  note VARCHAR(500),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6),
  version INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_public_id (public_id),
  UNIQUE KEY uk_orders_code (order_code),
  KEY ix_orders_user_status_created (user_id, status, created_at DESC),
  CONSTRAINT ck_orders_status CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  order_id BIGINT NOT NULL,
  variant_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(64) COLLATE utf8mb4_0900_as_cs,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_items_public_id (public_id),
  KEY ix_order_items_order (order_id),
  KEY ix_order_items_variant (variant_id),
  CONSTRAINT ck_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  order_id BIGINT NOT NULL,
  method VARCHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'PENDING',
  payment_ref VARCHAR(120) COLLATE utf8mb4_0900_as_cs,
  paid_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_payments_public_id (public_id),
  CONSTRAINT ck_payments_method CHECK (method IN ('COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO')),
  CONSTRAINT ck_payments_status CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reviews (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  order_id BIGINT,
  rating SMALLINT NOT NULL,
  content TEXT,
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_reviews_public_id (public_id),
  KEY ix_reviews_product (product_id),
  KEY ix_reviews_user (user_id),
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT ck_reviews_status CHECK (status IN ('PENDING', 'PUBLISHED', 'HIDDEN')),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE wishlists (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_wishlists_public_id (public_id),
  UNIQUE KEY uk_wishlists_user_product (user_id, product_id),
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE blog_posts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  author_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) COLLATE utf8mb4_0900_as_cs NOT NULL,
  excerpt VARCHAR(300),
  content TEXT,
  cover_image VARCHAR(255),
  meta_title VARCHAR(160),
  meta_description VARCHAR(255),
  status VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'DRAFT',
  published_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_blog_posts_public_id (public_id),
  UNIQUE KEY uk_blog_posts_slug (slug),
  CONSTRAINT ck_blog_posts_status CHECK (status IN ('DRAFT', 'PUBLISHED')),
  CONSTRAINT fk_blog_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT NOT NULL,
  title VARCHAR(160),
  body VARCHAR(500),
  type VARCHAR(40),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_notifications_public_id (public_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE url_redirects (
  id BIGINT NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  old_path VARCHAR(255) COLLATE utf8mb4_0900_as_cs NOT NULL,
  new_path VARCHAR(255) NOT NULL,
  status INTEGER NOT NULL DEFAULT 301,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_url_redirects_public_id (public_id),
  UNIQUE KEY uk_url_redirects_old_path (old_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
