import type { Route } from "./+types/admin.catalog";
import { CatalogManagement } from "~/features/admin-catalog/components/CatalogManagement";

export function meta(_: Route.MetaArgs) { return [{ title: "Danh mục & thương hiệu — ProjectSale Admin" }]; }
export default function AdminCatalogRoute() { return <CatalogManagement />; }
