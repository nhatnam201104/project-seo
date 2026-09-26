import type { Route } from "./+types/admin";
import { AdminDashboard } from "~/features/admin-dashboard/components/AdminDashboard";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Tổng quan kinh doanh — ProjectSale Admin" },
    {
      name: "description",
      content: "Prototype dashboard vận hành ProjectSale với dữ liệu minh họa.",
    },
  ];
}

export default function Admin() {
  return <AdminDashboard />;
}
