import { z } from "zod";
import type { AxiosInstance, ApiEnvelope } from "~/core/api";
import { AUTH_ENDPOINTS } from "./auth.endpoints";
import {
  authUserSchema,
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  registerRequestSchema,
  resendOtpRequestSchema,
  tokenPairSchema,
  tokenResponseSchema,
  verifyRequestSchema,
} from "../validation/auth.schema";
import type {
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
  ResendOtpRequest,
  VerifyRequest,
} from "./auth.types";

async function post<T>(
  client: AxiosInstance,
  url: string,
  body: unknown,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await client.post<ApiEnvelope<unknown>>(url, body, {
    signal,
  });
  const envelope = response.data;
  if (envelope?.error) {
    throw {
      status: 502,
      message: envelope.error.message,
      detailMessage: envelope.error.detailMessage,
    };
  }
  const parsed = schema.safeParse(envelope?.data);
  if (!parsed.success)
    throw {
      status: 502,
      message: "Phản hồi xác thực không hợp lệ. Vui lòng thử lại sau.",
    };
  return parsed.data;
}

export function login(
  client: AxiosInstance,
  body: LoginRequest,
  signal?: AbortSignal,
) {
  return post(
    client,
    AUTH_ENDPOINTS.login,
    loginRequestSchema.parse(body),
    tokenResponseSchema,
    signal,
  );
}
export function register(
  client: AxiosInstance,
  body: RegisterRequest,
  signal?: AbortSignal,
) {
  return post(
    client,
    AUTH_ENDPOINTS.register,
    registerRequestSchema.parse(body),
    z.null(),
    signal,
  );
}
export function verify(
  client: AxiosInstance,
  body: VerifyRequest,
  signal?: AbortSignal,
) {
  return post(
    client,
    AUTH_ENDPOINTS.verify,
    verifyRequestSchema.parse(body),
    tokenResponseSchema,
    signal,
  );
}
export function resendOtp(
  client: AxiosInstance,
  body: ResendOtpRequest,
  signal?: AbortSignal,
) {
  return post(
    client,
    AUTH_ENDPOINTS.resendOtp,
    resendOtpRequestSchema.parse(body),
    z.null(),
    signal,
  );
}
export function refresh(
  client: AxiosInstance,
  body: RefreshRequest,
  signal?: AbortSignal,
) {
  return post(
    client,
    AUTH_ENDPOINTS.refresh,
    refreshRequestSchema.parse(body),
    tokenPairSchema,
    signal,
  );
}
export function logout(
  client: AxiosInstance,
  body: LogoutRequest,
  signal?: AbortSignal,
) {
  return post(
    client,
    AUTH_ENDPOINTS.logout,
    logoutRequestSchema.parse(body),
    z.null(),
    signal,
  );
}
export function getMe(client: AxiosInstance, signal?: AbortSignal) {
  return post(client, AUTH_ENDPOINTS.me, {}, authUserSchema, signal);
}
