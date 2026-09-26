import type { AxiosInstance } from "axios";

/**
 * Ngữ cảnh gắn vào mỗi request. Được truyền từ nơi TẠO client (per-request ở
 * server), không đọc từ store toàn cục — tránh rò dữ liệu giữa các request SSR.
 */
export type RequestContext = {
  /** Lấy access token hiện tại (server đọc từ session). */
  getAccessToken?: () => string | null | undefined;
  /** Token giỏ hàng guest (header X-Cart-Token). */
  cartToken?: string | null;
  /** Locale gửi kèm nếu backend hỗ trợ. */
  locale?: string;
  /** Danh tính trình duyệt chuyển tiếp cho API; bỏ trống thì không gửi header nào. */
  forwarded?: ForwardedClient;
};

/**
 * Mọi request tới API đều đi từ server SSR, nên backend chỉ thấy IP của SSR. SSR
 * chuyển tiếp IP/User-Agent thật của trình duyệt kèm bí mật dùng chung; backend
 * chỉ tin các header này khi bí mật khớp.
 */
export type ForwardedClient = {
  secret: string;
  clientIp?: string;
  userAgent?: string;
};

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function applyRequestInterceptor(
  instance: AxiosInstance,
  ctx: RequestContext,
): void {
  instance.interceptors.request.use((config) => {
    const token = ctx.getAccessToken?.();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    if (ctx.cartToken) {
      config.headers.set("X-Cart-Token", ctx.cartToken);
    }

    if (ctx.locale) {
      config.headers.set("Accept-Language", ctx.locale);
    }

    if (ctx.forwarded) {
      config.headers.set("X-Internal-Proxy-Secret", ctx.forwarded.secret);
      if (ctx.forwarded.clientIp) {
        config.headers.set("X-Forwarded-For", ctx.forwarded.clientIp);
      }
      if (ctx.forwarded.userAgent) {
        config.headers.set("X-Forwarded-User-Agent", ctx.forwarded.userAgent);
      }
    }

    config.headers.set("X-Correlation-ID", randomId());

    // Không log body/token — chỉ metadata nếu cần debug.
    return config;
  });
}
