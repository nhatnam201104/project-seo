import type { AxiosInstance, ApiEnvelope } from "~/core/api";
import { unwrapData } from "~/core/api";
import { AUTH_ENDPOINTS } from "./auth.endpoints";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from "./auth.types";

/**
 * API module cho Auth. Mỗi hàm nhận `client: AxiosInstance` (DI) — không import
 * axios trực tiếp. Ở SSR bridge, client được tạo per-request tại lib/http.server.
 *
 * Backend bọc payload trong envelope { error, data, pagination } → bóc `data` bằng unwrapData.
 */

export async function login(
  client: AxiosInstance,
  body: LoginRequest,
  signal?: AbortSignal,
): Promise<LoginResponse> {
  const res = await client.post<ApiEnvelope<LoginResponse>>(
    AUTH_ENDPOINTS.login,
    body,
    {
      signal,
    },
  );
  return unwrapData(res.data);
}

export async function register(
  client: AxiosInstance,
  body: RegisterRequest,
  signal?: AbortSignal,
): Promise<RegisterResponse> {
  const res = await client.post<ApiEnvelope<RegisterResponse>>(
    AUTH_ENDPOINTS.register,
    body,
    { signal },
  );
  return unwrapData(res.data);
}

export async function refresh(
  client: AxiosInstance,
  refreshToken: string,
  signal?: AbortSignal,
): Promise<RefreshResponse> {
  const res = await client.post<ApiEnvelope<RefreshResponse>>(
    AUTH_ENDPOINTS.refresh,
    { refresh_token: refreshToken },
    { signal },
  );
  return unwrapData(res.data);
}

export async function logout(
  client: AxiosInstance,
  body: LogoutRequest,
): Promise<void> {
  await client.post(AUTH_ENDPOINTS.logout, body);
}

export async function getMe(
  client: AxiosInstance,
  signal?: AbortSignal,
): Promise<AuthUser> {
  const res = await client.get<ApiEnvelope<AuthUser>>(AUTH_ENDPOINTS.me, {
    signal,
  });
  return unwrapData(res.data);
}
