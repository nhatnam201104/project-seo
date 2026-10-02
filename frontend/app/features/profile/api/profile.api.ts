import type { AxiosInstance, ApiEnvelope } from "~/core/api";
import { unwrapData } from "~/core/api";
import { PROFILE_ENDPOINTS } from "./profile.endpoints";
import type { Profile, UpdateProfileInput } from "./profile.types";

export async function getProfile(client: AxiosInstance, signal?: AbortSignal): Promise<Profile> {
  const res = await client.get<ApiEnvelope<Profile>>(PROFILE_ENDPOINTS.me, { signal });
  return unwrapData(res.data);
}

export async function updateProfile(client: AxiosInstance, body: UpdateProfileInput, signal?: AbortSignal): Promise<Profile> {
  const res = await client.put<ApiEnvelope<Profile>>(PROFILE_ENDPOINTS.me, body, { signal });
  return unwrapData(res.data);
}

export async function changePassword(
  client: AxiosInstance,
  body: { current_password: string; new_password: string },
  signal?: AbortSignal,
): Promise<void> {
  await client.post(PROFILE_ENDPOINTS.password, body, { signal });
}

export async function uploadAvatar(client: AxiosInstance, file: File, signal?: AbortSignal): Promise<Profile> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post<ApiEnvelope<Profile>>(PROFILE_ENDPOINTS.avatar, form, { signal });
  return unwrapData(res.data);
}
