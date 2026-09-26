import type { Route } from "./+types/landing";
import { LandingPage } from "~/components/landing/LandingPage";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "ProjectSale — Mắt kính chính hãng, giá minh bạch" },
    {
      name: "description",
      content:
        "Chọn gọng kính, kính râm và tròng kính theo khuôn mặt, nhu cầu và ngân sách. Giá minh bạch, giao hàng toàn quốc.",
    },
  ];
}

export const links: Route.LinksFunction = () => [
  // Preload tài nguyên above-the-fold: hero image + font variable duy nhất.
  {
    rel: "preload",
    as: "image",
    href: "/landing/hero-1600.webp",
    fetchPriority: "high",
    media: "(min-width: 768px)",
  },
  {
    rel: "preload",
    as: "image",
    href: "/landing/hero-800.webp",
    fetchPriority: "high",
    media: "(max-width: 767px)",
  },
  {
    rel: "preload",
    as: "font",
    href: "/landing/archivo-var.woff2",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export default function Landing() {
  return <LandingPage />;
}
