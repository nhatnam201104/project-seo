/**
 * Nội dung dùng chung cho header + footer storefront.
 * Đổi chữ/link ở đây, không sửa trong component.
 */

export interface StoreCategoryGroup {
  title: string;
  /** Có slug = nhóm sản phẩm thật (lọc được ở /products); không có = nhóm khám phá */
  slug?: string;
  links: readonly string[];
}

export interface PolicyPage {
  slug: string;
  title: string;
}

export const STORE_CATEGORIES: readonly StoreCategoryGroup[] = [
  { title: "Eyeglasses", slug: "eyeglasses", links: ["Acetate", "Titanium", "Metal"] },
  { title: "Sunglasses", slug: "sunglasses", links: ["Classic", "Sport", "Polarized"] },
  { title: "Lenses", slug: "lenses", links: ["Blue-light", "Prescription", "Photochromic"] },
  { title: "Discover", links: ["New arrivals", "Best sellers", "Face-shape guide"] },
];

export const POLICY_PAGES: readonly PolicyPage[] = [
  { slug: "doi-tra", title: "Chính sách đổi trả" },
  { slug: "bao-hanh", title: "Chính sách bảo hành" },
  { slug: "van-chuyen", title: "Chính sách vận chuyển" },
  { slug: "thanh-toan", title: "Chính sách thanh toán" },
  { slug: "bao-mat", title: "Chính sách bảo mật" },
];

export const STORE_ABOUT = {
  summary:
    "Gọng đẹp — giá minh bạch. Chọn kính theo khuôn mặt, tròng đúng nhu cầu, giao hàng toàn quốc.",
  links: [
    { label: "Về ProjectSale", href: "/#manifesto" },
    { label: "Tất cả sản phẩm", href: "/products" },
  ],
} as const;

// TODO: thay bằng thông tin liên hệ thật của cửa hàng (hiện là placeholder).
export const STORE_CONTACT = {
  email: "hotro@projectsale.vn",
  phone: { display: "0900 000 000", tel: "+84900000000" },
  address: "123 Đường Mẫu, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
} as const;

export function findPolicy(slug: string | undefined): PolicyPage | undefined {
  return POLICY_PAGES.find((policy) => policy.slug === slug);
}
