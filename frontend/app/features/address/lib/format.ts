import type { Address } from "../api/address.types";

export function fullAddress(a: Address): string {
  return [a.line, a.ward, a.district, a.city].filter(Boolean).join(", ");
}

export type AddressNotice = "created" | "updated" | "deleted" | "default";

export const ADDRESS_NOTICES: Record<AddressNotice, string> = {
  created: "Đã thêm địa chỉ",
  updated: "Đã cập nhật địa chỉ",
  deleted: "Đã xóa địa chỉ",
  default: "Đã đặt làm địa chỉ mặc định",
};

export function isAddressNotice(value: string | null): value is AddressNotice {
  return value !== null && Object.prototype.hasOwnProperty.call(ADDRESS_NOTICES, value);
}
