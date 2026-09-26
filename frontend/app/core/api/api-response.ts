/**
 * Envelope chuẩn hoá của backend — MỌI response đều có shape:
 *   { error, data, pagination } (khoá luôn hiện diện, null khi không áp dụng).
 */
export type EnvelopeError = {
  message: string;
  /** Chi tiết kỹ thuật tuỳ chọn (vd: lỗi từng field). */
  detailMessage?: string;
};

/** Thông tin phân trang tách riêng khỏi `data`. `page` bắt đầu từ 0 (chuẩn Spring Data). */
export type Pagination = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ApiEnvelope<T> = {
  error: EnvelopeError | null;
  data: T | null;
  pagination: Pagination | null;
};

/**
 * Trang dữ liệu nội bộ của frontend (giữ ổn định để component/loader không đổi).
 * `number` là chỉ số trang hiện tại, 0-indexed.
 */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

/** Tham số phân trang + sort theo chuẩn Spring: ?page=0&size=20&sort=field,asc|desc */
export type PageParams = {
  page?: number;
  size?: number;
  /** Ví dụ: "createdAt,desc" hoặc "minPrice,asc". */
  sort?: string;
};

/** Bóc `data` khỏi envelope (endpoint không phân trang). */
export function unwrapData<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data as T;
}

/** Bóc envelope phân trang → `Page<T>` nội bộ, gộp `data` (content) với `pagination`. */
export function unwrapPage<T>(envelope: ApiEnvelope<T[]>): Page<T> {
  const pagination = envelope.pagination;
  return {
    content: envelope.data ?? [],
    number: pagination?.page ?? 0,
    size: pagination?.size ?? 0,
    totalElements: pagination?.totalElements ?? 0,
    totalPages: pagination?.totalPages ?? 0,
  };
}

export function emptyPage<T>(size = 20): Page<T> {
  return { content: [], totalElements: 0, totalPages: 0, number: 0, size };
}
