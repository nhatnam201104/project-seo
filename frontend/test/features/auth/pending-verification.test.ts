// @vitest-environment node
import axios, { AxiosError, type AxiosAdapter } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.hoisted(() => {
  process.env.API_BASE_URL = "http://localhost:8081/api/v1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters";
});
import { action as login } from "~/routes/login";
import { action as register } from "~/routes/register";
import { action as verify, loader as verifyLoader } from "~/routes/verify";

import { getSession } from "~/lib/session.server";
import { beginPendingVerification, readPendingVerification, savePendingVerification } from "~/features/auth/services/pending-verification.server";

const user = { id: "f9f72790-5713-4f56-a931-99c08b747f5f", email: "nam@example.com", full_name: "Nguyễn Nam", phone: "0901234567", role: "USER" };
const calls: { url?: string; body: Record<string, unknown> }[] = [];
let failure: { status: number; message: string; retryAfter?: number } | null;
const adapter: AxiosAdapter = async (config) => {
  calls.push({ url: config.url, body: JSON.parse(config.data ?? "{}") });
  if (failure) throw new AxiosError("failure", undefined, config, null, {
    config, status: failure.status, statusText: "Error", headers: { "retry-after": failure.retryAfter },
    data: { error: { message: failure.message }, data: null, pagination: null },
  });
  return { config, status: 200, statusText: "OK", headers: {}, data: { error: null, pagination: null,
    data: config.url === "/auth/register" || config.url === "/auth/resendOTP" ? null : { access_token: "access", refresh_token: "refresh", user } } };
};
function args(path: string, fields?: Record<string, string>, cookie = "") {
  return { request: new Request(`http://localhost${path}`, { method: fields ? "POST" : "GET", headers: { Cookie: cookie }, body: fields ? new URLSearchParams(fields) : undefined }), params: {}, context: {} } as never;
}
function requestWith(cookie: string) { return new Request("http://localhost/verify", { headers: { Cookie: cookie } }); }
function pendingCookie(headers: Headers) {
  return headers.getSetCookie().find((value) => value.startsWith("__ps_pending_verification="))!.split(";")[0]!;
}
async function start(email = user.email) {
  const response = await beginPendingVerification({ email, source: "login", remember: true, redirectTo: "/account?tab=orders" });
  const cookie = pendingCookie(response.headers);
  const pending = (await readPendingVerification(requestWith(cookie)))!;
  return { cookie, pending };
}
beforeEach(() => { calls.length = 0; failure = null; axios.defaults.adapter = adapter; });
afterEach(() => vi.useRealTimers());

describe("pending verification route flow", () => {
  it("redirects pending login without sending mail or creating a logged-in session", async () => {
    failure = { status: 403, message: "Account not verified" };
    const response = await login(args("/login", { email: user.email, password: "password123", remember: "on", redirectTo: "/account?tab=orders" })) as Response;
    expect(response.headers.get("Location")).toBe("/verify");
    const pending = await readPendingVerification(requestWith(pendingCookie(response.headers)));
    expect(pending).toMatchObject({ email: user.email, source: "login", remember: true, redirectTo: "/account?tab=orders" });
    expect(pending?.lastSentAt).toBeUndefined();
    expect(calls.map((call) => call.url)).toEqual(["/auth/login"]);
    expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith("__ps_session="))).toBe(false);
  });
  it.each([[401, "Invalid email or password"], [404, "User not found"], [403, "Forbidden"]])("does not create pending context for %s / %s", async (status, message) => {
    failure = { status: Number(status), message: String(message) };
    const response = await login(args("/login", { email: user.email, password: "wrong" }));
    expect(response).toMatchObject({ init: { status } });
    expect(JSON.stringify(response)).not.toContain("__ps_pending_verification");
    expect(calls).toHaveLength(1);
  });
  it("registers once, preserves email in cookie, and exposes only a masked email on reload", async () => {
    const response = await register(args("/register", { email: user.email, full_name: user.full_name, phone: user.phone, password: "password123", confirm_password: "password123", terms: "on" })) as Response;
    const cookie = pendingCookie(response.headers);
    expect(response.headers.get("Location")).toBe("/verify");
    const first = await verifyLoader(args("/verify?email=other@example.com", undefined, cookie));
    await verifyLoader(args("/verify", undefined, cookie));
    expect(first.data).toMatchObject({ maskedEmail: "n***@example.com", source: "register", lastSentAt: expect.any(Number) });
    expect(JSON.stringify(first.data)).not.toContain(user.email);
    expect(calls.map((call) => call.url)).toEqual(["/auth/register"]);
  });
  it("keeps a failed registration out of the pending flow", async () => {
    failure = { status: 403, message: "Account not verified" };
    const response = await register(args("/register", { email: user.email, full_name: user.full_name, phone: user.phone, password: "password123", confirm_password: "password123", terms: "on" }));
    expect(response).toMatchObject({ data: { error: expect.stringContaining("đăng nhập") }, init: { status: 403 } });
  });
  it("ignores injected email and redirect, verifies leading-zero OTP, restores remember and clears pending cookie", async () => {
    const { cookie, pending } = await start();
    const response = await verify(args("/verify?email=other@example.com", { flowId: pending.flowId, otp: "001234", email: "other@example.com", redirectTo: "//evil.example", remember: "off" }, cookie)) as Response;
    expect(calls[0]).toMatchObject({ url: "/auth/verify", body: { email: user.email, otp: "001234", deviceId: expect.any(String) } });
    expect(response.headers.get("Location")).toBe("/account?tab=orders");
    const sessionCookie = response.headers.getSetCookie().find((value) => value.startsWith("__ps_session="))!;
    expect(sessionCookie).toContain("Max-Age=604800");
    expect((await getSession(sessionCookie)).get("user")).toEqual(user);
    expect(response.headers.getSetCookie().find((value) => value.startsWith("__ps_pending_verification="))).toContain("Max-Age=0");
  });
  it("retains pending state for invalid or expired OTP", async () => {
    const { cookie, pending } = await start();
    const invalid = await verify(args("/verify", { flowId: pending.flowId, otp: "abc" }, cookie));
    expect(invalid).toMatchObject({ init: { status: 400 }, data: { fieldErrors: { otp: expect.any(String) } } });
    expect(calls).toHaveLength(0);
    failure = { status: 400, message: "Invalid OTP OR expired" };
    const expired = await verify(args("/verify", { flowId: pending.flowId, otp: "001234" }, cookie));
    expect(expired).toMatchObject({ init: { status: 400 }, data: { fieldErrors: { otp: expect.any(String) } } });
    expect(await readPendingVerification(requestWith(cookie))).not.toBeNull();
  });
  it("resends only on explicit action and persists cooldown across reloads and submissions", async () => {
    const { cookie, pending } = await start();
    const response = await verify(args("/verify", { flowId: pending.flowId, intent: "resend", email: "other@example.com" }, cookie));
    if (response instanceof Response) throw new Error("Expected action data");
    const updatedCookie = pendingCookie(new Headers(response.init?.headers));
    const refreshed = await verifyLoader(args("/verify", undefined, updatedCookie));
    expect(refreshed.data.resendAvailableAt).toBeGreaterThan(Date.now());
    expect(response.data.otpResetKey).toBeTruthy();
    const limited = await verify(args("/verify", { flowId: pending.flowId, intent: "resend" }, updatedCookie));
    expect(limited).toMatchObject({ init: { status: 429 } });
    expect(calls).toEqual([{ url: "/auth/resendOTP", body: { email: user.email } }]);
  });
  it("persists backend 429 without claiming successful delivery, and reports service failures", async () => {
    const { cookie, pending } = await start();
    failure = { status: 429, message: "Too many requests", retryAfter: 120 };
    const limited = await verify(args("/verify", { flowId: pending.flowId, intent: "resend" }, cookie));
    if (limited instanceof Response) throw new Error("Expected action data");
    const persisted = await readPendingVerification(requestWith(pendingCookie(new Headers(limited.init?.headers))));
    expect(persisted?.resendAvailableAt).toBeGreaterThan(Date.now() + 110_000);
    expect(limited.data.message).toBeUndefined();
    expect(limited.data.retryAt).toBeUndefined();
    failure = { status: 503, message: "Unavailable" };
    const failed = await verify(args("/verify", { flowId: pending.flowId, intent: "resend" }, cookie));
    expect(failed).toMatchObject({ init: { status: 503 }, data: { error: expect.any(String) } });
  });
  it.each(["", "__ps_pending_verification=corrupt"])("rejects direct access and cookie corruption", async (cookie) => {
    await expect(verifyLoader(args("/verify?email=nam@example.com", undefined, cookie))).rejects.toMatchObject({ status: 302 });
    await expect(verify(args("/verify", { otp: "001234" }, cookie))).rejects.toMatchObject({ status: 302 });
    expect(calls).toHaveLength(0);
  });
  it("enforces expiry server-side, including replay of a previously valid signed cookie", async () => {
    const { cookie } = await start();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 16 * 60_000);
    expect(await readPendingVerification(requestWith(cookie))).toBeNull();
    await expect(verifyLoader(args("/verify", undefined, cookie))).rejects.toMatchObject({ status: 302 });
  });
  it("blocks stale tabs from verifying, resending or cancelling a different flow", async () => {
    const first = await start();
    const second = await start("other@example.com");
    for (const intent of ["verify", "resend", "cancel"]) {
      const result = await verify(args("/verify", { flowId: first.pending.flowId, intent, otp: "001234" }, second.cookie));
      expect(result).toMatchObject({ init: { status: 409 }, data: { reloadRequired: true } });
    }
    expect(calls).toHaveLength(0);
  });
  it("cancels pending verification with POST and retains the intended login destination", async () => {
    const { cookie, pending } = await start();
    const response = await verify(args("/verify", { flowId: pending.flowId, intent: "cancel" }, cookie)) as Response;
    expect(response.headers.get("Location")).toContain("/login?verification=cancelled");
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(calls).toHaveLength(0);
  });
  it("does not extend the overall flow expiry when persisting resend state", async () => {
    const { pending } = await start();
    const updated = await savePendingVerification({ ...pending, resendAvailableAt: Date.now() + 300_000 });
    expect((await readPendingVerification(requestWith(updated)))?.expiresAt).toBe(pending.expiresAt);
  });
});
