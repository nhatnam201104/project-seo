import { Link } from "react-router";

export function AdminFooter() {
  return (
    <footer className="admin-footer">
      <span>ProjectSale · Khu vực quản trị</span>
      <Link to="/">Về trang chủ</Link>
    </footer>
  );
}
