import type { Route } from "./+types/admin.users";
import { UserManagement } from "~/features/admin-users/components/UserManagement";

export function meta(_: Route.MetaArgs) { return [{ title: "Người dùng — ProjectSale Admin" }]; }
export default function AdminUsersRoute() { return <UserManagement />; }
