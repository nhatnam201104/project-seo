import { randomUUID } from "node:crypto";
import { createCookie } from "react-router";
import { serverEnv } from "~/core/config/env.server";
import { deviceSchema } from "../validation/auth.schema";
import type { DeviceInfo } from "../api/auth.types";

const deviceCookie = createCookie("__ps_device", {
  httpOnly: true,
  sameSite: "lax",
  secure: serverEnv.cookieSecure,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  secrets: [serverEnv.sessionSecret],
});
export async function getDevice(request: Request) {
  const stored: unknown = await deviceCookie.parse(
    request.headers.get("Cookie"),
  );
  const existing = deviceSchema.shape.deviceId.safeParse(stored);
  const deviceId = existing.success ? existing.data : randomUUID();
  const ua = request.headers.get("User-Agent")?.toLowerCase() ?? "";
  const platform: DeviceInfo["platform"] = /iphone|ipad|ipod/.test(ua)
    ? "IOS"
    : ua.includes("android")
      ? "ANDROID"
      : ua.includes("windows")
        ? "WINDOWS"
        : ua.includes("mac")
          ? "MACOS"
          : ua.includes("linux")
            ? "LINUX"
            : "UNKNOWN";
  const device: DeviceInfo = {
    deviceId,
    platform,
    deviceName: `ProjectSale Web (${platform})`,
  };
  const headers = new Headers();
  if (!existing.success)
    headers.append("Set-Cookie", await deviceCookie.serialize(deviceId));
  return { device, headers };
}
