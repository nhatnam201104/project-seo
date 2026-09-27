import { data, Link } from "react-router";
import type { Route } from "./+types/policies.$slug";
import {
  findPolicy,
  POLICY_PAGES,
  STORE_CONTACT,
  type PolicyPage,
} from "~/components/storefront/storefront-content";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.policy.title ?? "Chính sách"} — ProjectSale` }];
}

export function loader({ params }: Route.LoaderArgs) {
  const policy = findPolicy(params.slug);
  if (!policy) throw data(null, { status: 404 });
  return { policy, index: POLICY_PAGES.indexOf(policy) + 1 };
}

type PolicyShellProps = { kicker: string; title: string; notice: string; links: readonly PolicyPage[] };

function PolicyShell({ kicker, title, notice, links }: PolicyShellProps) {
  return (
    <section className="policy-page" aria-labelledby="policy-heading">
      <div className="policy-page__layout">
        <div className="policy-main">
          <p className="policy-main__kicker">{kicker}</p>
          <h1 id="policy-heading">{title}</h1>
          <p className="policy-main__notice">
            {notice} Cần hỗ trợ ngay, vui lòng liên hệ{" "}
            <a href={`mailto:${STORE_CONTACT.email}`}>{STORE_CONTACT.email}</a> hoặc hotline{" "}
            <a href={`tel:${STORE_CONTACT.phone.tel}`}>{STORE_CONTACT.phone.display}</a>.
          </p>
        </div>
        <nav className="policy-nav" aria-label="Chính sách khác">
          <p>CHÍNH SÁCH KHÁC</p>
          <ul>
            {links.map((item) => <li key={item.slug}><Link to={`/policies/${item.slug}`}>{item.title}</Link></li>)}
          </ul>
        </nav>
      </div>
    </section>
  );
}

// Trang khung: nội dung chính sách thật sẽ được bổ sung sau.
export default function Policy({ loaderData }: Route.ComponentProps) {
  const { policy, index } = loaderData;

  return (
    <PolicyShell
      kicker={`CHÍNH SÁCH / ${String(index).padStart(2, "0")}`}
      title={policy.title}
      notice="Nội dung đang được cập nhật."
      links={POLICY_PAGES.filter((item) => item.slug !== policy.slug)}
    />
  );
}

// Slug lạ: giữ header/footer của client layout thay vì rơi về ErrorBoundary trần của root.
export function ErrorBoundary() {
  return (
    <PolicyShell
      kicker="CHÍNH SÁCH / 404"
      title="Không tìm thấy chính sách"
      notice="Chính sách bạn tìm không tồn tại hoặc đã được đổi địa chỉ."
      links={POLICY_PAGES}
    />
  );
}
