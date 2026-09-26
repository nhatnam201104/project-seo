import type { Route } from "./+types/admin.reviews";
import { ReviewManagement } from "~/features/admin-reviews/components/ReviewManagement";

export function meta(_: Route.MetaArgs) { return [{ title: "Kiểm duyệt đánh giá — ProjectSale Admin" }]; }
export default function AdminReviewsRoute() { return <ReviewManagement />; }
