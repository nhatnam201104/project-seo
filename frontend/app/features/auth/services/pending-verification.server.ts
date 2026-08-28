import { randomUUID } from "node:crypto";
import { createCookie, redirect } from "react-router";
import { serverEnv } from "~/core/config/env.server";
import {
  pendingVerificationSchema,
  type PendingVerification,
} from "../validation/auth.schema";

const lifetimeMs = 15 * 60 * 1000;
const cookie = createCookie("__ps_pending_verification", {
  httpOnly: true,
  sameSite: "lax",
  secure: serverEnv.cookieSecure,
  path: "/",
  secrets: [serverEnv.sessionSecret],
});

export async function clearPendingVerification() {
  return cookie.serialize("", { maxAge: 0, expires: new Date(0) });
}

export async function savePendingVerification(pending: PendingVerification) {
  const valid = pendingVerificationSchema.parse(pending);
  return cookie.serialize(valid, {
    maxAge: Math.max(0, Math.ceil((valid.expiresAt - Date.now()) / 1000)),
  });
}

export async function beginPendingVerification(
  input: Pick<
    PendingVerification,
    "email" | "source" | "redirectTo" | "remember"
  >,
  suppliedHeaders?: Headers,
) {
  const now = Date.now();
  const pending: PendingVerification = {
    ...input,
    flowId: randomUUID(),
    expiresAt: now + lifetimeMs,
    ...(input.source === "register" ? { lastSentAt: now } : {}),
  };
  const headers = new Headers(suppliedHeaders);
  headers.set("Cache-Control", "no-store");
  headers.append("Set-Cookie", await savePendingVerification(pending));
  return redirect("/verify", { headers });
}

export async function readPendingVerification(
  request: Request,
): Promise<PendingVerification | null> {
  try {
    const parsed = pendingVerificationSchema.safeParse(
      await cookie.parse(request.headers.get("Cookie")),
    );
    if (!parsed.success || parsed.data.expiresAt <= Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function requirePendingVerification(request: Request) {
  const pending = await readPendingVerification(request);
  if (!pending) {
    throw redirect("/login?verification=expired", {
      headers: {
        "Set-Cookie": await clearPendingVerification(),
        "Cache-Control": "no-store",
      },
    });
  }
  return pending;
}

export function maskEmail(email: string) {
  const separator = email.lastIndexOf("@");
  return `${email.slice(0, 1)}***${email.slice(separator)}`;
}
