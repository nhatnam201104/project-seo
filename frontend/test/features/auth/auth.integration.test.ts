// @vitest-environment node
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.API_BASE_URL = "http://localhost:8081/api/v1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters";
});
import { createPublicServerApi } from "~/lib/http.server";
import { createApiClient, mapAxiosError } from "~/core/api";
import * as authApi from "~/features/auth/api/auth.api";
import { action as login, loader as loginLoader } from "~/routes/login";
import { action as register } from "~/routes/register";
import { action as verify } from "~/routes/verify";
import { getSession, commitSession } from "~/lib/session.server";
import { safeRedirect, requireUser } from "~/lib/auth.server";
import { authFormError } from "~/features/auth/services/auth-form.server";
import { beginPendingVerification, readPendingVerification } from "~/features/auth/services/pending-verification.server";

const user = { id: "f9f72790-5713-4f56-a931-99c08b747f5f", email: "nam@example.com", full_name: "Nguyễn Nam", phone: "0901234567", role: "USER" };
const tokens = { access_token: "access-test", refresh_token: "refresh-test", user };
const calls: { url?: string; method?: string; body: Record<string, unknown> }[] = [];
let payload: unknown = tokens;
const adapter: AxiosAdapter = async (config) => {
  calls.push({ url: config.url, method: config.method, body: JSON.parse(config.data ?? "{}") });
  return { status: 200, statusText: "OK", data: { error: null, data: payload, pagination: null }, headers: {}, config };
};
function request(path: string, fields: Record<string, string>, cookie?: string) {
  return { request: new Request(`http://localhost${path}`, { method: "POST", body: new URLSearchParams(fields), headers: cookie ? { Cookie: cookie } : undefined }), params: {}, context: {} } as never;
}
beforeEach(() => { calls.length = 0; payload = tokens; axios.defaults.adapter = adapter; });

describe("auth SSR routes and API contract", () => {
  it("registers without issuing a session and redirects to OTP verification", async () => {
    payload = null;
    const result = await register(request("/register", { email: user.email, full_name: user.full_name, phone: user.phone, password: "password123", confirm_password: "password123", terms: "on", redirectTo: "/account?tab=orders" })) as Response;
    expect(result.status).toBe(302);
    expect(result.headers.get("Location")).toBe("/verify");
    expect(result.headers.get("Set-Cookie")).toContain("__ps_pending_verification=");
    expect(result.headers.get("Set-Cookie")).not.toContain("__ps_session=");
    expect(calls).toEqual([{ url: "/auth/register", method: "post", body: { email: user.email, full_name: user.full_name, phone: user.phone, password: "password123" } }]);
  });
  it("rejects invalid registration fields before calling backend", async () => {
    const result = await register(request("/register", { email: "invalid", password: "short" }));
    expect(result).toMatchObject({ init: { status: 400 }, data: { fieldErrors: { email: expect.any(String), phone: expect.any(String), password: expect.any(String) } } });
    expect(calls).toHaveLength(0);
  });
  it("keeps device stable from loader to login and records it with httpOnly tokens", async () => {
    const loaded = await loginLoader({ request: new Request("http://localhost/login"), params: {}, context: {} } as never);
    const deviceCookie = loaded.init?.headers as Headers;
    const cookie = deviceCookie.get("Set-Cookie")!.split(";")[0]!;
    const response = await login(request("/login", { email: user.email, password: "password123", redirectTo: "//evil.example" }, cookie)) as Response;
    expect(response.headers.get("Location")).toBe("/account");
    const sessionCookie = response.headers.getSetCookie().find((value) => value.startsWith("__ps_session="))!;
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).not.toContain("Max-Age");
    const session = await getSession(sessionCookie);
    expect(session.get("accessToken")).toBe(tokens.access_token);
    expect(session.get("deviceId")).toBe(calls[0]?.body.deviceId);
    expect(calls[0]).toMatchObject({ url: "/auth/login", body: { deviceId: expect.any(String), platform: "UNKNOWN" } });
    expect(await response.text()).not.toContain(tokens.access_token);
  });
  it("uses persistent session cookies only when remember is selected", async () => {
    const response = await login(request("/login", { email: user.email, password: "password123", remember: "on" })) as Response;
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=604800");
  });
  it("verifies OTP and creates a session, or resends without requiring an OTP", async () => {
    const start = await beginPendingVerification({ email: user.email, source: "login", remember: false, redirectTo: "/account" });
    const cookie = start.headers.get("Set-Cookie")!.split(";")[0]!;
    const pending = await readPendingVerification(new Request("http://localhost/verify", { headers: { Cookie: cookie } }));
    const response = await verify(request("/verify", { flowId: pending!.flowId, otp: "001234" }, cookie)) as Response;
    expect(response.status).toBe(302);
    expect(calls[0]).toMatchObject({ url: "/auth/verify", body: { otp: "001234", deviceId: expect.any(String) } });
    payload = null;
    const resent = await verify(request("/verify", { flowId: pending!.flowId, intent: "resend" }, cookie));
    expect(resent).toMatchObject({ data: { message: expect.any(String), resendAvailableAt: expect.any(Number) } });
    expect(calls[1]).toEqual({ url: "/auth/resendOTP", method: "post", body: { email: user.email } });
  });
  it("uses POST /auth/me and rejects malformed token responses", async () => {
    payload = user;
    expect(await authApi.getMe(createPublicServerApi(new Request("http://localhost/"), {}))).toEqual(user);
    expect(calls[0]?.url).toBe("/auth/me");
    expect(calls[0]?.method).toBe("post");
    payload = { access_token: "missing-refresh" };
    await expect(authApi.refresh(createPublicServerApi(new Request("http://localhost/"), {}), { refresh_token: "old" })).rejects.toMatchObject({ status: 502 });
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/\nevil.example"])("blocks unsafe redirect %s", (path) => {
    expect(safeRedirect(path)).toBe("/account");
  });
  it("redirects anonymous users before accessing backend", async () => {
    await expect(requireUser(new Request("http://localhost/account?tab=orders"), {})).rejects.toMatchObject({ status: 302 });
    expect(calls).toHaveLength(0);
  });
  it("maps backend field errors and rate limit formats", () => {
    expect(authFormError({ status: 400, message: "Dữ liệu không hợp lệ", detailMessage: "fullName: Họ tên quá dài; phone: Không hợp lệ" })).toMatchObject({ data: { fieldErrors: { full_name: "Họ tên quá dài", phone: "Không hợp lệ" } } });
    const config = {} as InternalAxiosRequestConfig;
    const error = new AxiosError("limited", undefined, config, null, { status: 429, statusText: "limited", config, headers: { "retry-after": "300" }, data: { error: "Too Many Requests", message: "Thử lại sau", retryAfter: 60 } });
    const mapped = mapAxiosError(error);
    expect(mapped).toMatchObject({ status: 429, message: "Thử lại sau", retryAfter: 300 });
    expect(authFormError(mapped)).toMatchObject({ init: { status: 429 }, data: { retryAt: expect.any(Number) } });
  });
  it("shows the standard 429 envelope in Vietnamese with the real wait time", () => {
    const config = {} as InternalAxiosRequestConfig;
    const error = new AxiosError("limited", undefined, config, null, { status: 429, statusText: "limited", config, headers: { "retry-after": "420" }, data: { error: { message: "Too many requests" }, data: null, pagination: null } });
    const before = Date.now();
    const result = authFormError(mapAxiosError(error));
    expect(result).toMatchObject({ init: { status: 429 }, data: { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." } });
    expect(result.data.retryAt).toBeGreaterThanOrEqual(before + 420_000);
  });
  it("tells a user registering with a disabled account's email to contact support", () => {
    expect(authFormError({ status: 403, message: "Account disabled" })).toMatchObject({
      init: { status: 403 },
      data: { error: "Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ bộ phận hỗ trợ." },
    });
  });
});

describe("refresh rotation", () => {
  function expired(config: InternalAxiosRequestConfig) {
    return new AxiosError("expired", undefined, config, null, { status: 401, statusText: "Unauthorized", data: { error: { message: "Expired" }, data: null, pagination: null }, headers: {}, config });
  }
  it("coalesces concurrent 401 responses and retries with the rotated token", async () => {
    let access = "old";
    const refresh = vi.fn(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); return { accessToken: "new", refreshToken: "rotated" }; });
    const client = createApiClient({ baseURL: "http://backend", request: { getAccessToken: () => access }, refresh: {
      getRefreshToken: () => "refresh", performRefresh: refresh, onTokensRefreshed: (tokens) => { access = tokens.accessToken; }, onRefreshFailed: vi.fn(),
    } });
    client.defaults.adapter = async (config) => {
      if (config.headers.get("Authorization") === "Bearer old") throw expired(config);
      return { status: 200, statusText: "OK", headers: {}, config, data: "done" };
    };
    const results = await Promise.all([client.post("/auth/me"), client.post("/auth/me")]);
    expect(results.map((result) => result.data)).toEqual(["done", "done"]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("keeps sessions during outages and invalidates rejected refresh tokens", async () => {
    for (const status of [503, 401]) {
      const failed = vi.fn();
      const client = createApiClient({ baseURL: "http://backend", refresh: { getRefreshToken: () => "refresh", performRefresh: async () => { throw { status, message: "Refresh failed" }; }, onTokensRefreshed: vi.fn(), onRefreshFailed: failed } });
      client.defaults.adapter = async (config) => { throw expired(config); };
      await expect(client.post("/auth/me")).rejects.toMatchObject({ status });
      expect(failed).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
    }
  });
  it("serializes device and token fields in an existing session", async () => {
    const session = await getSession();
    session.set("deviceId", user.id);
    session.set("refreshToken", "rotated");
    const restored = await getSession(await commitSession(session));
    expect(restored.get("deviceId")).toBe(user.id);
    expect(restored.get("refreshToken")).toBe("rotated");
  });
});
