/**
 * Giá trị bộ lọc gửi lên GET /products. Backend so khớp không phân biệt hoa thường
 * trên cột gender / variant.color / face_tag — các giá trị dưới đây PHẢI khớp dữ
 * liệu thật trong DB; đổi tại đây khi seed dữ liệu khác.
 */
export const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Mới nhất" },
  { value: "minPrice,asc", label: "Giá thấp đến cao" },
  { value: "minPrice,desc", label: "Giá cao đến thấp" },
] as const;

export const GENDER_OPTIONS = [
  { value: "nam", label: "Nam" },
  { value: "nu", label: "Nữ" },
  { value: "unisex", label: "Unisex" },
] as const;

export const FACE_OPTIONS = [
  { value: "tron", label: "Tròn" },
  { value: "vuong", label: "Vuông" },
  { value: "oval", label: "Oval" },
] as const;

export const COLOR_OPTIONS = [
  { value: "black", label: "Đen", css: "#111111" },
  { value: "tortoise", label: "Đồi mồi", css: "#7a4b2a" },
  { value: "clear", label: "Trong suốt", css: "#d9d5cc" },
  { value: "silver", label: "Bạc", css: "#b8bcc2" },
  { value: "gold", label: "Vàng", css: "#c8a24a" },
] as const;

const SORT_VALUES: readonly string[] = SORT_OPTIONS.map((o) => o.value);

/** Chấp nhận sort hợp lệ; alias cũ ("new") của menu → mới nhất. */
export function normalizeSort(value: string | null | undefined): string {
  if (value && SORT_VALUES.includes(value)) return value;
  return SORT_OPTIONS[0].value;
}

export function colorCss(name: string | null | undefined): string {
  const key = (name ?? "").trim().toLowerCase();
  return COLOR_OPTIONS.find((c) => c.value === key || c.label.toLowerCase() === key)?.css ?? "#cfc4c5";
}
