import type { AxiosInstance, ApiEnvelope } from "~/core/api";
import { unwrapData } from "~/core/api";
import { ADDRESS_ENDPOINTS } from "./address.endpoints";
import type { Address, AddressInput } from "./address.types";

export async function listAddresses(client: AxiosInstance, signal?: AbortSignal): Promise<Address[]> {
  const res = await client.get<ApiEnvelope<Address[]>>(ADDRESS_ENDPOINTS.collection, { signal });
  return unwrapData(res.data) ?? [];
}

export async function getAddress(client: AxiosInstance, id: string, signal?: AbortSignal): Promise<Address> {
  const res = await client.get<ApiEnvelope<Address>>(ADDRESS_ENDPOINTS.item(id), { signal });
  return unwrapData(res.data);
}

export async function createAddress(client: AxiosInstance, body: AddressInput, signal?: AbortSignal): Promise<Address> {
  const res = await client.post<ApiEnvelope<Address>>(ADDRESS_ENDPOINTS.collection, body, { signal });
  return unwrapData(res.data);
}

export async function updateAddress(client: AxiosInstance, id: string, body: AddressInput, signal?: AbortSignal): Promise<Address> {
  const res = await client.put<ApiEnvelope<Address>>(ADDRESS_ENDPOINTS.item(id), body, { signal });
  return unwrapData(res.data);
}

export async function deleteAddress(client: AxiosInstance, id: string, signal?: AbortSignal): Promise<void> {
  await client.delete(ADDRESS_ENDPOINTS.item(id), { signal });
}

export async function makeDefaultAddress(client: AxiosInstance, id: string, signal?: AbortSignal): Promise<void> {
  await client.post(ADDRESS_ENDPOINTS.makeDefault(id), {}, { signal });
}
