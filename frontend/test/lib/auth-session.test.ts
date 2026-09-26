// @vitest-environment node
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let server: Server;
let auth: typeof import("~/lib/auth.server");
let sessions: typeof import("~/lib/session.server");
let account: typeof import("~/routes/account");
let logout: typeof import("~/routes/logout");
let mode: "rotate" | "revoked" | "outage" | "retry-denied" | "logout-outage" = "rotate";
const calls: { path: string; body: Record<string, unknown>; authorization?: string }[] = [];
const user = { id: "f9f72790-5713-4f56-a931-99c08b747f5f", email: "nam@example.com", full_name: "Nguyễn Nam", phone: "0901234567", role: "USER" as const };

beforeAll(async () => {
  server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const path = request.url!;
    calls.push({ path, body, authorization: request.headers.authorization });
    let status = 200;
    let payload: unknown = null;
    if (request.method !== "POST") status = 405;
    else if (path.endsWith("/refresh")) {
      status = mode === "revoked" ? 401 : mode === "outage" ? 503 : 200;
      payload = { access_token: "fresh-access", refresh_token: "fresh-refresh" };
    } else if (path.endsWith("/me")) {
      status = request.headers.authorization === "Bearer old-access" || mode === "retry-denied" ? 401 : 200;
      payload = user;
    } else if (path.endsWith("/logout")) {
      status = mode === "logout-outage" ? 503 : 200;
    } else status = 404;
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: status >= 400 ? { message: "Service error" } : null, data: status >= 400 ? null : payload, pagination: null }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  vi.stubEnv("API_BASE_URL", `http://127.0.0.1:${address.port}/api/v1`);
  vi.stubEnv("SESSION_SECRET", "test-session-secret-at-least-32-characters");
  auth = await import("~/lib/auth.server");
  sessions = await import("~/lib/session.server");
  account = await import("~/routes/account");
  logout = await import("~/routes/logout");
});
afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); vi.unstubAllEnvs(); });
beforeEach(() => { mode = "rotate"; calls.length = 0; });

async function sessionRequest(path = "/account") {
  const response = await auth.createUserSession({ accessToken: "old-access", refreshToken: "old-refresh", user, deviceId: user.id, redirectTo: path });
  return new Request(`http://frontend${path}`, { method: path === "/logout" ? "POST" : "GET", headers: { Cookie: response.headers.get("Set-Cookie")! } });
}

describe("SSR auth bridge against an HTTP backend", () => {
  it("rotates both tokens, retries /me, and persists the cookie in account loader", async () => {
    const result = await account.loader({ request: await sessionRequest(), params: {}, context: {} } as never);
    expect(result.data.me).toEqual(user);
    const cookie = new Headers(result.init?.headers).get("Set-Cookie")!;
    const session = await sessions.getSession(cookie);
    expect(session.get("accessToken")).toBe("fresh-access");
    expect(session.get("refreshToken")).toBe("fresh-refresh");
    expect(session.get("deviceId")).toBe(user.id);
    expect(cookie).not.toContain("Max-Age");
    expect(calls.map((call) => call.path)).toEqual(["/api/v1/auth/me", "/api/v1/auth/refresh", "/api/v1/auth/me"]);
  });
  it("logs out using the rotated refresh token and original device", async () => {
    const result = await logout.action({ request: await sessionRequest("/logout"), params: {}, context: {} } as never);
    expect(result.headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970");
    expect(calls.at(-1)).toEqual({ path: "/api/v1/auth/logout", authorization: "Bearer fresh-access", body: { refresh_token: "fresh-refresh", deviceId: user.id } });
  });
  it.each(["revoked", "retry-denied"] as const)("clears %s sessions and redirects to login without a refresh loop", async (nextMode) => {
    mode = nextMode;
    const response = await auth.requireUser(await sessionRequest(), {}).catch((error: Response) => error) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?redirectTo=%2Faccount");
    expect(response.headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970");
    expect(calls.filter((call) => call.path.endsWith("/refresh"))).toHaveLength(1);
  });
  it("does not erase sessions during a refresh outage", async () => {
    mode = "outage";
    const response = await auth.requireUser(await sessionRequest(), {}).catch((error: Response) => error) as Response;
    expect(response.status).toBe(503);
    expect(response.headers.has("Set-Cookie")).toBe(false);
  });
  it("clears local session even when backend logout fails", async () => {
    mode = "logout-outage";
    const result = await logout.action({ request: await sessionRequest("/logout"), params: {}, context: {} } as never);
    expect(result.headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970");
  });
});
