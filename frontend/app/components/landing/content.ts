/**
 * Toàn bộ nội dung landing page eyewear của ProjectSale.
 * Đổi chữ/ảnh/sản phẩm ở đây, không sửa trong component.
 */

export interface LandingImage {
  /** Ảnh desktop (~1600w) */
  src: string;
  /** Ảnh mobile (~800w) */
  srcSmall: string;
  alt: string;
  /** Tỷ lệ gốc để giữ chỗ, tránh layout shift khi ở layout dọc */
  aspectRatio: string;
}

export interface CampaignProduct {
  id: string;
  name: string;
  /** Glyph kỹ thuật đi kèm tên (ngôn ngữ đồ hoạ của campaign) */
  glyph: string;
  price: string;
  /** Ảnh preview khi hover ở showcase */
  preview: string;
}

export interface GalleryPanel {
  image: LandingImage;
  /** Sản phẩm gắn tag trên panel */
  productId: string;
  /** Vị trí focus của ảnh (object-position) */
  focus: string;
  /** Hình sigil hiển thị khi panel này vào — khớp SigilMorph */
  sigil: "diamond" | "squiggle" | "triangle";
}

export const BRAND = {
  name: "PROJECTSALE",
  campaign: "BỘ SƯU TẬP 01",
  season: "GỌNG ĐẸP — GIÁ MINH BẠCH",
  location: "Chọn kính theo khuôn mặt · Giao toàn quốc",
} as const;

export const NAV_LINKS = [
  { label: "Mua kính", to: "/products" },
  { label: "Chọn kính", to: "#manifesto" },
  { label: "Về shop", to: "#final" },
] as const;

// Chưa có kênh liên hệ ProjectSale được xác thực; không hiển thị link giả.
export const SOCIAL_LINKS: readonly { label: string; href: string }[] = [];

export const IMAGES = {
  hero: {
    src: "/landing/hero-1600.webp",
    srcSmall: "/landing/hero-800.webp",
    alt: "Chân dung người mẫu đeo gọng kính đen trong ánh sáng studio tối",
    aspectRatio: "4 / 5",
  },
  statement: {
    src: "/landing/statement-1600.webp",
    srcSmall: "/landing/statement-800.webp",
    alt: "Người phụ nữ đeo kính râm tròn trong ánh nắng ấm",
    aspectRatio: "3 / 2",
  },
  final: {
    src: "/landing/final-1600.webp",
    srcSmall: "/landing/final-800.webp",
    alt: "Người phụ nữ đeo gọng kính trong suốt giữa không gian xanh ngoài trời",
    aspectRatio: "3 / 2",
  },
  menu: {
    src: "/landing/window-forest-1600.webp",
    srcSmall: "/landing/window-forest-800.webp",
    alt: "Người đàn ông đeo kính đen đứng trước bức tường đỏ",
    aspectRatio: "3 / 2",
  },
} satisfies Record<string, LandingImage>;

export const PRODUCTS: readonly CampaignProduct[] = [
  {
    id: "acetate-frame",
    name: "Gọng Acetate 01",
    glyph: "◇",
    price: "1.290.000 ₫",
    preview: "/landing/panel-shell-800.webp",
  },
  {
    id: "titanium-frame",
    name: "Gọng Titanium 02",
    glyph: "÷",
    price: "1.590.000 ₫",
    preview: "/landing/panel-boot-800.webp",
  },
  {
    id: "uv400-sunglasses",
    name: "Kính Râm UV400",
    glyph: "↑",
    price: "1.190.000 ₫",
    preview: "/landing/panel-ridge-800.webp",
  },
  {
    id: "blue-light-lenses",
    name: "Tròng Lọc Ánh Sáng Xanh",
    glyph: "∿",
    price: "690.000 ₫",
    preview: "/landing/chip-parka.webp",
  },
] as const;

export const GALLERY_PANELS: readonly GalleryPanel[] = [
  {
    image: {
      src: "/landing/panel-shell-1600.webp",
      srcSmall: "/landing/panel-shell-800.webp",
      alt: "Gọng kính kim loại mảnh đặt trên nền hồng tối giản",
      aspectRatio: "3 / 2",
    },
    productId: "acetate-frame",
    focus: "68% 55%",
    sigil: "diamond",
  },
  {
    image: {
      src: "/landing/panel-ridge-1600.webp",
      srcSmall: "/landing/panel-ridge-800.webp",
      alt: "Chân dung người đeo kính trong bố cục vòng sáng tương phản",
      aspectRatio: "2 / 3",
    },
    productId: "uv400-sunglasses",
    focus: "50% 50%",
    sigil: "squiggle",
  },
  {
    image: {
      src: "/landing/panel-boot-1600.webp",
      srcSmall: "/landing/panel-boot-800.webp",
      alt: "Gọng kính đen tối giản đặt trên mặt phẳng xanh nhạt",
      aspectRatio: "5 / 4",
    },
    productId: "titanium-frame",
    focus: "68% 52%",
    sigil: "triangle",
  },
  {
    image: {
      src: "/landing/panel-lake-1600.webp",
      srcSmall: "/landing/panel-lake-800.webp",
      alt: "Người mẫu đeo gọng kính trong suốt dưới ánh nắng ngoài trời",
      aspectRatio: "16 / 9",
    },
    productId: "blue-light-lenses",
    focus: "50% 50%",
    sigil: "diamond",
  },
] as const;

export const STATEMENT_LINES = [
  "GỌNG HỢP KHUÔN MẶT,",
  "TRÒNG ĐÚNG NHU CẦU.",
] as const;

/** Đoạn văn manifesto — xen glyph kỹ thuật như bản tham chiếu. */
export const MANIFESTO_PARAGRAPHS = [
  "Chọn một chiếc kính ◇ bắt đầu từ cách gọng ôm khuôn mặt ≠ không chỉ từ xu hướng.",
  "Mặt tròn hợp góc cạnh ÷ mặt vuông cần đường cong ÷ khuôn oval linh hoạt với nhiều dáng gọng.",
  "Tròng kính ✦ cần đúng nhịp sống ∴ chống UV cho nắng ∧ lọc ánh sáng xanh cho ngày dài trước màn hình.",
  "Giá gọng và lựa chọn tròng được tách rõ ↑ để bạn biết mình đang trả cho điều gì.",
  "Nhìn rõ ✕ và đúng gu — không cần phức tạp.",
] as const;

/** Chip ảnh trôi parallax trong manifesto (thay cutout PNG của bản gốc). */
export const MANIFESTO_CHIPS = [
  { src: "/landing/chip-pack-green.webp", alt: "Kính đọc sách đặt trên trang giấy mở", speed: 0.65, rotate: -5, top: "4%", left: "6%", width: 190 },
  { src: "/landing/chip-parka.webp", alt: "Gọng kính lọc ánh sáng xanh đặt trên laptop", speed: 1.3, rotate: 4, top: "12%", left: "72%", width: 165 },
  { src: "/landing/chip-boot-stream.webp", alt: "Gọng kính đen đặt cạnh điện thoại trên nền trắng", speed: 0.9, rotate: -3, top: "34%", left: "14%", width: 210 },
  { src: "/landing/chip-pack-navy.webp", alt: "Gọng kính trong không gian làm việc tối giản", speed: 1.15, rotate: 6, top: "46%", left: "68%", width: 175 },
  { src: "/landing/chip-boot-top.webp", alt: "Gọng kính tròn đặt trong hộp trên nền xám", speed: 0.75, rotate: -6, top: "66%", left: "8%", width: 185 },
  { src: "/landing/chip-pack-hand.webp", alt: "Gọng kính trong suốt trên nền vải nhiều màu", speed: 1.45, rotate: 3, top: "74%", left: "70%", width: 160 },
] as const;

export const FINAL_CTA = {
  heading: "CHIẾC KÍNH ĐÚNG ĐANG CHỜ BẠN.",
  action: "Khám phá sản phẩm",
  to: "/products",
} as const;
