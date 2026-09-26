import type { Route } from "./+types/admin.promotions";
import { PromotionManagement } from "~/features/admin-promotions/components/PromotionManagement";

export function meta(_: Route.MetaArgs) { return [{ title: "Khuyến mãi — ProjectSale Admin" }]; }
export default function AdminPromotionsRoute() { return <PromotionManagement />; }
