// @vitest-environment node
import axios, { AxiosError, type AxiosAdapter } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.API_BASE_URL = "http://localhost:8081/api/v1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters";
  process.env.GOOGLE_AUTH_START_URL = "http://localhost:8081/oauth2/authorization/google";
});
import { loader as startGoogle } from "~/routes/auth.google";
import { loader as googleCallback } from "~/routes/auth.google.callback";
import { loader as loginLoader } from "~/routes/login";
import { getSession } from "~/lib/session.server";
import {
  createOAuthState,
  saveOAuthState,
} from "~/features/auth/services/oauth-state.server";

const user = { id: "f9f72790-5713-4f56-a931-99c08b747f5f", email: "nam@gmail.com", full_name: "Nguyễn Nam", phone: null, role: "USER" };
const tokens = { access_token: "access-google", refresh_token: "refresh-google", user };
const calls: { url?: string; body: Record<string, unknown> }[] = [];
let respond: AxiosAdapter;
const ok: AxiosAdapter = async (config) => {
  calls.push({ url: config.url, body: JSON.parse(config.data ?? "{}") });
  return { status: 200, statusText: "OK", data: { error: null, data: tokens, pagination: null }, headers: {}, config };
};
beforeEach(() => {
  calls.length = 0;
  respond = ok;
  axios.defaults.adapter = (config) => respond(config);
});

function args(url: string, cookie?: string) {
  return { request: new Request(url, { headers: cookie ? { Cookie: cookie } : undefined }), params: {}, context: {} } as never;
}
function cookiePair(setCookie: string) {
  return setCookie.split(";")[0]!;
}
async function stateCookie(redirectTo = "/account?tab=orders") {
  const state = createOAuthState(redirectTo);
  return { state, cookie: cookiePair(await saveOAuthState(state)) };
}

describe("Google login start", () => {
  it("stores a bind nonce and redirect target, then sends the browser to the backend", async () => {
    const response = (await startGoogle(args("http://localhost/auth/google?redirectTo=%2Fcart"))) as Response;

    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("Location")!);
    expect(`${location.origin}${location.pathname}`).toBe("http://localhost:8081/oauth2/authorization/google");
    const bind = location.searchParams.get("bind")!;
    expect(bind).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const setCookie = response.headers.get("Set-Cookie")!;
    expect(setCookie).toContain("__ps_oauth=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/auth/google");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("never keeps an off-site redirect target", async () => {
    const response = (await startGoogle(args("http://localhost/auth/google?redirectTo=%2F%2Fevil.example"))) as Response;
    const cookie = cookiePair(response.headers.get("Set-Cookie")!);

    const callback = (await googleCallback(args("http://localhost/auth/google/callback?code=abc", cookie))) as Response;

    expect(callback.headers.get("Location")).toBe("/account");
  });
});

describe("Google login callback", () => {
  it("exchanges the code with the bound nonce and device, then creates an httpOnly session", async () => {
    const { state, cookie } = await stateCookie();

    const response = (await googleCallback(args("http://localhost/auth/google/callback?code=one-time", cookie))) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/account?tab=orders");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: "/auth/oauth2/exchange", body: { code: "one-time", bind: state.bind, deviceId: expect.any(String), platform: "UNKNOWN" } });
    const setCookies = response.headers.getSetCookie();
    const sessionCookie = setCookies.find((value) => value.startsWith("__ps_session="))!;
    expect(sessionCookie).toContain("HttpOnly");
    const session = await getSession(sessionCookie);
    expect(session.get("accessToken")).toBe("access-google");
    expect(session.get("deviceId")).toBe(calls[0]?.body.deviceId);
    expect(setCookies.some((value) => value.startsWith("__ps_oauth=;") || value.startsWith("__ps_oauth=") && value.includes("Max-Age=0"))).toBe(true);
  });

  it("rejects a callback that this browser did not start, without calling the backend", async () => {
    const response = (await googleCallback(args("http://localhost/auth/google/callback?code=attacker-code"))) as Response;

    expect(response.headers.get("Location")).toBe("/login?oauth_error=oauth_failed");
    expect(calls).toHaveLength(0);
  });

  it("rejects a callback without a code", async () => {
    const { cookie } = await stateCookie();

    const response = (await googleCallback(args("http://localhost/auth/google/callback", cookie))) as Response;

    expect(response.headers.get("Location")).toBe("/login?oauth_error=oauth_failed");
    expect(calls).toHaveLength(0);
  });

  it("maps a disabled account to its own message and keeps the redirect target", async () => {
    const { cookie } = await stateCookie("/cart");
    respond = async (config) => {
      throw new AxiosError("forbidden", undefined, config, null, { status: 403, statusText: "Forbidden", headers: {}, config, data: { error: { message: "Account disabled" }, data: null, pagination: null } });
    };

    const response = (await googleCallback(args("http://localhost/auth/google/callback?code=x", cookie))) as Response;

    expect(response.headers.get("Location")).toBe("/login?oauth_error=account_disabled&redirectTo=%2Fcart");
    expect(response.headers.getSetCookie().some((value) => value.startsWith("__ps_session="))).toBe(false);
  });

  it("maps an expired or reused code to a generic failure", async () => {
    const { cookie } = await stateCookie();
    respond = async (config) => {
      throw new AxiosError("unauthorized", undefined, config, null, { status: 401, statusText: "Unauthorized", headers: {}, config, data: { error: { message: "Invalid or expired login code" }, data: null, pagination: null } });
    };

    const response = (await googleCallback(args("http://localhost/auth/google/callback?code=x", cookie))) as Response;

    expect(response.headers.get("Location")).toContain("/login?oauth_error=oauth_failed");
  });
});

describe("login page Google errors", () => {
  it.each([
    ["account_disabled", "vô hiệu hoá"],
    ["access_denied", "huỷ đăng nhập"],
    ["something_unexpected", "không thành công"],
  ])("shows a message for oauth_error=%s", async (code, fragment) => {
    const result = await loginLoader(args(`http://localhost/login?oauth_error=${code}`));
    expect(result.data.oauthError).toContain(fragment);
  });

  it("shows nothing without an oauth_error", async () => {
    const result = await loginLoader(args("http://localhost/login"));
    expect(result.data.oauthError).toBeNull();
  });
});
