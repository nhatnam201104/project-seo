import { Link } from "react-router";

export function ClientFooter() {
  return (
    <footer className="client-footer">
      <span>© {new Date().getFullYear()} ProjectSale</span>
      <nav aria-label="Điều hướng chân trang khách hàng">
        <Link to="/">Trang chủ</Link>
        <Link to="/products">Sản phẩm</Link>
      </nav>
    </footer>
  );
}
