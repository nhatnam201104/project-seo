import { Link } from "react-router";
import { useClock } from "~/hooks/useClock";
import { BRAND, NAV_LINKS, SOCIAL_LINKS } from "./content";

interface SiteHeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

/**
 * Header dạng dải tab trắng viền đen "file-folder" + đồng hồ live,
 * cùng nút vuông bo góc mở menu overlay (vị trí nút ✕ trong bản tham chiếu).
 */
export function SiteHeader({ isMenuOpen, onToggleMenu }: SiteHeaderProps) {
  const clock = useClock();

  return (
    <>
      <header className="lp-header">
        <Link to="/" className="lp-tab lp-tab--logo" aria-label={`${BRAND.name} — trang chủ`}>
          {BRAND.name}
        </Link>
        <span className="lp-tab lp-tab--clock" suppressHydrationWarning aria-hidden="true">
          {clock}
        </span>

        <nav className="lp-header-nav" aria-label="Điều hướng chính">
          {NAV_LINKS.map((link) =>
            link.to.startsWith("#") ? (
              <a key={link.label} className="lp-tab" href={link.to}>
                {link.label}
              </a>
            ) : (
              <Link key={link.label} className="lp-tab" to={link.to}>
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="lp-header-social">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              className="lp-tab"
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </header>

      <button
        type="button"
        className="lp-menu-button"
        aria-expanded={isMenuOpen}
        aria-controls="lp-menu"
        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
        onClick={onToggleMenu}
      >
        <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <line className="lp-menu-icon-line" x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.6" />
          <line className="lp-menu-icon-line" x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.6" />
          <line className="lp-menu-icon-line" x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
    </>
  );
}
