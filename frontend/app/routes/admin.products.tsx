import type { Route } from "./+types/admin.products";
import { ProductManagement } from "~/features/admin-products/components/ProductManagement";

export function meta(_: Route.MetaArgs) { return [{ title: "Sản phẩm & kho — ProjectSale Admin" }]; }
export default function AdminProductsRoute() { return <ProductManagement />; }
