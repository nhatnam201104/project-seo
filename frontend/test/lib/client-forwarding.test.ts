// @vitest-environment node
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "internal-proxy-secret-at-least-32-chars!!";
const BROWSER_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)";
const sent: { url?: string; headers: Record<string, unknown> }[] = [];
const originalAdapter = axios.defaults.adapter;

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response = { status, statusText: String(status), data, headers: {}, config };
  if (status >= 400) {
    throw new AxiosError("failed", undefined, config, null, response);
  }
  return response;
}

const adapter: AxiosAdapter = async (config) => {
  sent.push({ url: config.url, headers: { ...config.headers } });
  if (config.url === "/auth/me" && config.headers.Authorization === "Bearer expired-access") {
    return respond(config, 401, { error: { message: "expired" }, data: null, pagination: null });
  }
  if (config.url === "/auth/refresh") {
    return respond(config, 200, {
      error: null,
      data: { access_token: "fresh-access", refresh_token: "fresh-refresh" },
      pagination: null,
    });
  }
  return respond(config, 200, {
    error: null,
    data: { id: "f9f72790-5713-4f56-a931-99c08b747f5f", email: "nam@example.com", full_name: null, phone: null, role: "USER" },
    pagination: null,
  });
};

function browserRequest(cookie?: string) {
  const headers: Record<string, string> = { "User-Agent": BROWSER_UA };
  if (cookie) headers.Cookie = cookie;
  return new Request("http://localhost/account", { headers });
}

async function loadModules(env: Record<string, string>) {
  vi.resetModules();
  vi.stubEnv("API_BASE_URL", "http://localhost:8081/api/v1");
  vi.stubEnv("SESSION_SECRET", "test-session-secret-at-least-32-characters");
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  const http = await import("~/lib/http.server");
  const sessions = await import("~/lib/session.server");
  const authApi = await import("~/features/auth/api/auth.api");
  return { http, sessions, authApi };
}

beforeEach(() => {
  sent.length = 0;
  axios.defaults.adapter = adapter;
});
afterEach(() => {
  axios.defaults.adapter = originalAdapter;
  vi.unstubAllEnvs();
});

describe("forwarding the browser identity to the API", () => {
  it("sends the shared secret, browser IP and User-Agent when a secret is configured", async () => {
    const { http, authApi } = await loadModules({ INTERNAL_PROXY_SECRET: SECRET });

    await authApi.getMe(http.createPublicServerApi(browserRequest(), { clientIp: "203.0.113.9" }));

    expect(sent[0]?.headers).toMatchObject({
      "X-Internal-Proxy-Secret": SECRET,
      "X-Forwarded-For": "203.0.113.9",
      "X-Forwarded-User-Agent": BROWSER_UA,
    });
  });

  it("sends none of the forwarding headers without a secret, so nothing is trusted by accident", async () => {
    const { http, authApi } = await loadModules({ INTERNAL_PROXY_SECRET: "" });

    await authApi.getMe(http.createPublicServerApi(browserRequest(), { clientIp: "203.0.113.9" }));

    expect(Object.keys(sent[0]?.headers ?? {})).not.toEqual(
      expect.arrayContaining(["X-Internal-Proxy-Secret"]),
    );
    expect(sent[0]?.headers["X-Forwarded-For"]).toBeUndefined();
    expect(sent[0]?.headers["X-Forwarded-User-Agent"]).toBeUndefined();
  });

  it("omits X-Forwarded-For when the server did not learn the client IP (dev server)", async () => {
    const { http, authApi } = await loadModules({ INTERNAL_PROXY_SECRET: SECRET });

    await authApi.getMe(http.createPublicServerApi(browserRequest(), {}));

    expect(sent[0]?.headers["X-Forwarded-For"]).toBeUndefined();
    expect(sent[0]?.headers["X-Internal-Proxy-Secret"]).toBe(SECRET);
  });

  it("forwards the browser identity on the token refresh triggered by a 401 as well", async () => {
    const { http, sessions, authApi } = await loadModules({ INTERNAL_PROXY_SECRET: SECRET });
    const session = await sessions.getSession();
    session.set("accessToken", "expired-access");
    session.set("refreshToken", "old-refresh");
    const cookie = (await sessions.commitSession(session)).split(";")[0]!;

    const auth = await http.createServerApi(browserRequest(cookie), { clientIp: "198.51.100.4" });
    await authApi.getMe(auth.client);

    const refresh = sent.find((call) => call.url === "/auth/refresh");
    expect(refresh?.headers).toMatchObject({
      "X-Internal-Proxy-Secret": SECRET,
      "X-Forwarded-For": "198.51.100.4",
      "X-Forwarded-User-Agent": BROWSER_UA,
    });
    expect(sent.at(-1)?.headers).toMatchObject({ "X-Forwarded-For": "198.51.100.4" });
  });
});

describe("production configuration", () => {
  it("refuses to start in production without the proxy secret", async () => {
    await expect(loadModules({ NODE_ENV: "production", INTERNAL_PROXY_SECRET: "" }))
      .rejects.toThrow(/INTERNAL_PROXY_SECRET/);
  });

  it("rejects a weak proxy secret", async () => {
    await expect(loadModules({ INTERNAL_PROXY_SECRET: "too-short" }))
      .rejects.toThrow(/INTERNAL_PROXY_SECRET/);
  });
});
