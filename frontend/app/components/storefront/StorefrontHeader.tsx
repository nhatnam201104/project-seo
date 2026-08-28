import { Form, Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "~/features/auth/api/auth.types";

type StorefrontHeaderProps = {
  user: AuthUser | null;
  overlay?: boolean;
};

const categories = [
  { title: "Eyeglasses", links: ["Acetate", "Titanium", "Metal"] },
  { title: "Sunglasses", links: ["Classic", "Sport", "Polarized"] },
  { title: "Lenses", links: ["Blue-light", "Prescription", "Photochromic"] },
  { title: "Discover", links: ["New arrivals", "Best sellers", "Face-shape guide"] },
];

function Icon({ name }: { name: "search" | "cart" | "menu" | "close" | "user" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
    cart: <><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    menu: <><path d="M3 7h18M3 17h18"/></>,
    close: <><path d="m5 5 14 14M19 5 5 19"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
  };
  return <svg className="sf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{paths[name]}</svg>;
}

export function StorefrontHeader({ user, overlay = false }: StorefrontHeaderProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setCategoryOpen(false);
        setAccountOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoryOpen(false);
        setAccountOpen(false);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const displayName = user?.full_name?.trim().split(/\s+/).at(-1) ?? user?.email.split("@")[0];

  return (
    <header ref={rootRef} className={`sf-header${overlay ? " sf-header--overlay" : ""}`}>
      <div className="sf-header__bar">
        <Link className="sf-header__brand" to="/">PROJECTSALE</Link>

        <nav className={`sf-header__nav${mobileOpen ? " is-open" : ""}`} aria-label="Điều hướng chính">
          <Link to="/products" onClick={() => setMobileOpen(false)}>PRODUCT</Link>
          <button
            type="button"
            className="sf-header__text-button"
            aria-expanded={categoryOpen}
            aria-controls="category-menu"
            onClick={() => { setCategoryOpen((value) => !value); setAccountOpen(false); }}
          >
            CATEGORY <span aria-hidden="true">{categoryOpen ? "−" : "+"}</span>
          </button>
          <a href="/#manifesto" onClick={() => setMobileOpen(false)}>ABOUT</a>
        </nav>

        <div className="sf-header__actions">
          <button className="sf-header__icon-button" type="button" aria-label="Tìm kiếm" onClick={() => setSearchOpen(true)}><Icon name="search" /></button>
          {user ? (
            <div className="sf-header__account-wrap">
              <button
                type="button"
                className="sf-header__account"
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                onClick={() => { setAccountOpen((value) => !value); setCategoryOpen(false); }}
              >
                <Icon name="user" /><span>{displayName?.toUpperCase()} / ACCOUNT</span>
              </button>
              {accountOpen ? (
                <div id="account-menu" className="sf-account-menu">
                  <p>Signed in as<br/><strong>{user.email}</strong></p>
                  <Link to="/account">Account overview</Link>
                  <Link to="/account#orders">My orders</Link>
                  <Link to="/account#saved">Saved items</Link>
                  <Link to="/account#address">Addresses</Link>
                  {user.role === "ADMIN" ? <Link to="/admin">Administration</Link> : null}
                  <Form method="post" action="/logout"><button type="submit">Log out</button></Form>
                </div>
              ) : null}
            </div>
          ) : <Link className="sf-header__login" to="/login">LOGIN</Link>}
          <Link className="sf-header__cart" to="/products" aria-label="Giỏ hàng, 0 sản phẩm"><Icon name="cart" /><span>CART (0)</span></Link>
          <button className="sf-header__mobile" type="button" aria-label={mobileOpen ? "Đóng điều hướng" : "Mở điều hướng"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}><Icon name={mobileOpen ? "close" : "menu"} /></button>
        </div>
      </div>

      {categoryOpen ? (
        <div id="category-menu" className="sf-mega-menu">
          <div className="sf-mega-menu__grid">
            {categories.map((group) => (
              <section key={group.title} aria-labelledby={`category-${group.title}`}>
                <h2 id={`category-${group.title}`}>{group.title}</h2>
                {group.links.map((label) => <Link key={label} to={`/products?category=${encodeURIComponent(label.toLowerCase())}`} onClick={() => setCategoryOpen(false)}>{label}</Link>)}
              </section>
            ))}
            <Link className="sf-mega-menu__feature" to="/products?sort=new" onClick={() => setCategoryOpen(false)}>
              <img src="/landing/panel-shell-800.webp" alt="Bộ sưu tập kính mới" />
              <span><small>FEATURED / 2026</small>NEW PERSPECTIVES →</span>
            </Link>
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="sf-search" role="dialog" aria-modal="true" aria-label="Tìm kiếm sản phẩm">
          <Form action="/products" method="get" className="sf-search__form">
            <label htmlFor="store-search">SEARCH THE COLLECTION</label>
            <div><input ref={searchRef} id="store-search" name="q" type="search" placeholder="Frames, sunglasses, lenses…" /><button type="submit">SEARCH →</button></div>
          </Form>
          <button type="button" className="sf-search__close" aria-label="Đóng tìm kiếm" onClick={() => setSearchOpen(false)}><Icon name="close" /></button>
        </div>
      ) : null}
    </header>
  );
}
