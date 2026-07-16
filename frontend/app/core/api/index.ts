/**
 * Barrel công khai của tầng API. Feature import từ "~/core/api", KHÔNG import
 * axios trực tiếp và KHÔNG rải rác `axios.get(...)` trong codebase.
 */
export { createApiClient } from "./api-client";
export type { CreateApiClientOptions, AxiosInstance } from "./api-client";

export { createAxiosInstance } from "./axios-instance";

export { mapAxiosError, isApiError } from "./api-error";
export type { ApiError } from "./api-error";

export { emptyPage, unwrapData, unwrapPage } from "./api-response";
export type {
  Page,
  PageParams,
  Pagination,
  ApiEnvelope,
  EnvelopeError,
} from "./api-response";

export type { RequestContext } from "./interceptors/request.interceptor";
export type {
  RefreshContext,
  RefreshedTokens,
} from "./interceptors/refresh-token.interceptor";
