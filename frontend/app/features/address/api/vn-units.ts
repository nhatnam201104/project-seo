/**
 * Danh mục hành chính VN 3 cấp (tỉnh/thành → quận/huyện → phường/xã) từ API công
 * khai provinces.open-api.vn. Gọi từ trình duyệt; backend chỉ lưu TÊN (chuỗi).
 */
export type Unit = { code: number; name: string };

const BASE = "https://provinces.open-api.vn/api";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Không tải được danh mục địa chỉ (${res.status}).`);
  return (await res.json()) as T;
}

const pick = (list: { code: number; name: string }[]): Unit[] =>
  list.map(({ code, name }) => ({ code, name }));

export async function fetchProvinces(signal?: AbortSignal): Promise<Unit[]> {
  return pick(await getJson<Unit[]>(`${BASE}/p/`, signal));
}

export async function fetchDistricts(provinceCode: number, signal?: AbortSignal): Promise<Unit[]> {
  const res = await getJson<{ districts: Unit[] }>(`${BASE}/p/${provinceCode}?depth=2`, signal);
  return pick(res.districts ?? []);
}

export async function fetchWards(districtCode: number, signal?: AbortSignal): Promise<Unit[]> {
  const res = await getJson<{ wards: Unit[] }>(`${BASE}/d/${districtCode}?depth=2`, signal);
  return pick(res.wards ?? []);
}
