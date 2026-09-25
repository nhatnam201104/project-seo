import "react-router";

declare module "react-router" {
  /** Do custom server (server.js) cung cấp; undefined khi chạy `react-router dev`. */
  interface AppLoadContext {
    /** IP của trình duyệt, đã tính các proxy tin cậy (TRUST_PROXY_HOPS). */
    clientIp?: string;
  }
}
