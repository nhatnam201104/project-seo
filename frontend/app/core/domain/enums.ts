/**
 * Enum miền — ánh xạ 1-1 từ `database/schema.dbml`.
 *
 * ĐÂY LÀ NGUỒN CHÂN LÝ cho các giá trị enum ở frontend. Khi backend/DB thêm giá
 * trị mới, cập nhật ở đây. KHÔNG tự chế thêm giá trị không có trong schema.
 */

// Enum user_role { USER, ADMIN }
export const ROLE = { USER: "USER", ADMIN: "ADMIN" } as const;
export type RoleCode = (typeof ROLE)[keyof typeof ROLE];

// Enum entity_status { ACTIVE, INACTIVE }
export const ENTITY_STATUS = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" } as const;
export type EntityStatus = (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS];

// Enum order_status
export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SHIPPING: "SHIPPING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Enum payment_status
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// Enum payment_method
export const PAYMENT_METHOD = {
  COD: "COD",
  BANK_TRANSFER: "BANK_TRANSFER",
  VNPAY: "VNPAY",
  MOMO: "MOMO",
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// Enum promo_type
export const PROMO_TYPE = { PERCENT: "PERCENT", AMOUNT: "AMOUNT" } as const;
export type PromoType = (typeof PROMO_TYPE)[keyof typeof PROMO_TYPE];

// Enum review_status
export const REVIEW_STATUS = {
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  HIDDEN: "HIDDEN",
} as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

// Enum post_status
export const POST_STATUS = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED" } as const;
export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

/**
 * UUID public trong API. Backend giữ BIGINT làm khoá kỹ thuật nội bộ và không
 * expose qua request/response.
 */
export type Id = string;
