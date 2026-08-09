import type { Route } from "./+types/admin.orders";
import { OrderManagement } from "~/features/admin-orders/components/OrderManagement";

export function meta(_: Route.MetaArgs) { return [{ title: "Đơn hàng — ProjectSale Admin" }]; }
export default function AdminOrdersRoute() { return <OrderManagement />; }
