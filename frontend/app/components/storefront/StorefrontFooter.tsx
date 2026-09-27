import { Link } from "react-router";
import type { ReactNode } from "react";
import {
  POLICY_PAGES,
  STORE_ABOUT,
  STORE_CATEGORIES,
  STORE_CONTACT,
} from "./storefront-content";

type FooterColumnProps = {
  id: string;
  title: string;
  className: string;
  children: ReactNode;
};

function FooterColumn({ id, title, className, children }: FooterColumnProps) {
  return (
    <section className={`sf-footer__col ${className}`} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

export function StorefrontFooter() {
  const productGroups = STORE_CATEGORIES.filter((group) => group.slug);

  return (
    <footer className="sf-footer">
      <div className="sf-footer__grid">
        <FooterColumn
          id="footer-about"
          title="Giới thiệu"
          className="sf-footer__col--about"
        >
          <p className="sf-footer__summary">{STORE_ABOUT.summary}</p>
          <ul>
            {STORE_ABOUT.links.map((link) => (
              <li key={link.href}>
                {link.href.includes("#") ? (
                  <a href={link.href}>
                    {link.label} <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <Link to={link.href}>
                    {link.label} <span aria-hidden="true">→</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn
          id="footer-policy"
          title="Chính sách"
          className="sf-footer__col--policy"
        >
          <ul>
            {POLICY_PAGES.map((policy) => (
              <li key={policy.slug}>
                <Link to={`/policies/${policy.slug}`}>{policy.title}</Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn
          id="footer-category"
          title="Danh mục"
          className="sf-footer__col--category"
        >
          <ul>
            {productGroups.map((group) => (
              <li key={group.slug}>
                <Link to={`/products?category=${group.slug}`}>
                  {group.title}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/products?sort=new">New arrivals</Link>
            </li>
          </ul>
        </FooterColumn>

        <FooterColumn
          id="footer-contact"
          title="Liên hệ"
          className="sf-footer__col--contact"
        >
          <address>
            <p>
              EMAIL
              <a href={`mailto:${STORE_CONTACT.email}`}>
                {STORE_CONTACT.email}
              </a>
            </p>
            <p>
              HOTLINE
              <a href={`tel:${STORE_CONTACT.phone.tel}`}>
                {STORE_CONTACT.phone.display}
              </a>
            </p>
            <p>
              CỬA HÀNG<span>{STORE_CONTACT.address}</span>
            </p>
          </address>
        </FooterColumn>
      </div>

      <div className="sf-footer__bottom">
        <span>
          © {new Date().getFullYear()} PROJECTSALE — GỌNG ĐẸP, GIÁ MINH BẠCH
        </span>
        <span>TP. HỒ CHÍ MINH / VIỆT NAM</span>
      </div>
    </footer>
  );
}
