import { data, Link } from "react-router";
import type { Route } from "./+types/account";
import { requireUser } from "~/lib/auth.server";
import { isEndpointMissing } from "~/lib/action-error.server";
import { AccountShell, PageHeading } from "~/components/store/AccountShell";
import * as addressApi from "~/features/address/api/address.api";
import type { Address } from "~/features/address/api/address.types";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Tài khoản — ProjectSale" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  // requireUser → ném redirect /login nếu chưa đăng nhập.
  const auth = await requireUser(request, context);
  const me = auth.user;

  let addresses: Address[] = [];
  try {
    addresses = await addressApi.listAddresses(auth.client, request.signal);
  } catch (error) {
    // Backend chưa có endpoint địa chỉ: Overview vẫn hiển thị, chỉ thiếu mục địa chỉ.
    if (!isEndpointMissing(error)) throw error;
  }
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  // Nếu vừa refresh, ghi token mới vào session cookie (Set-Cookie).
  const setCookie = await auth.commit();
  return data(
    { me, defaultAddress, addressCount: addresses.length },
    setCookie ? { headers: { "Set-Cookie": setCookie } } : undefined,
  );
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { me, defaultAddress, addressCount } = loaderData;
  const firstName = me.full_name?.trim().split(/\s+/).at(-1) ?? me.email.split("@")[0] ?? "bạn";

  return (
    <AccountShell active="overview">
      <PageHeading title={`Xin chào, ${firstName}.`} lead="Quản lý đơn hàng, địa chỉ và thông tin tài khoản." />

      <div className="sp-overview">
        <div className="sp-stats" id="saved">
          <Link to="/account#orders"><b>0</b><span>Đơn hàng</span><em>Xem đơn hàng →</em></Link>
          <Link to="/products"><b>0</b><span>Đã lưu</span><em>Xem sản phẩm →</em></Link>
          <Link to="/account/addresses"><b>{addressCount}</b><span>Địa chỉ</span><em>Quản lý địa chỉ →</em></Link>
        </div>

        <div className="sp-panels">
          <section className="sp-panel" aria-labelledby="profile-panel">
            <h2 id="profile-panel">Thông tin cá nhân</h2>
            <div className="sp-panel__body">
              <p className="sp-panel__name">{me.full_name ?? "Chưa cập nhật tên"}</p>
              <p>{me.email}</p>
              <p>{me.phone ?? "Chưa cung cấp số điện thoại"}</p>
            </div>
            <div className="sp-panel__actions">
              <Link className="sp-btn sp-btn--sm" to="/account/profile">Sửa hồ sơ</Link>
              <Link className="sp-btn sp-btn--sm sp-btn--ghost" to="/account/profile#password">Đổi mật khẩu</Link>
            </div>
          </section>

          <section className="sp-panel" aria-labelledby="address-panel">
            <h2 id="address-panel">Địa chỉ mặc định</h2>
            {defaultAddress ? (
              <address className="sp-panel__body">
                <p className="sp-panel__name">{defaultAddress.receiver_name}</p>
                <p>{defaultAddress.receiver_phone}</p>
                <p className="sp-panel__lines">
                  {[defaultAddress.line, defaultAddress.ward, defaultAddress.district, defaultAddress.city]
                    .filter(Boolean)
                    .map((part) => <span key={part}>{part}</span>)}
                </p>
              </address>
            ) : (
              <p>Bạn chưa lưu địa chỉ giao hàng nào.</p>
            )}
            <div className="sp-panel__actions">
              <Link className="sp-more" to="/account/addresses">Quản lý địa chỉ →</Link>
              {defaultAddress ? null : <Link className="sp-btn sp-btn--sm" to="/account/addresses/new">Thêm địa chỉ</Link>}
            </div>
          </section>
        </div>

        <section className="sp-panel sp-orders" id="orders" aria-labelledby="orders-panel">
          <h2 id="orders-panel">Đơn hàng gần đây</h2>
          <div className="sp-orders__empty">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></svg>
            <p className="sp-panel__name">Chưa có đơn hàng nào</p>
            <p>Đơn hàng bạn mua sẽ xuất hiện tại đây.</p>
            <Link className="sp-btn sp-btn--sm" to="/products">Bắt đầu mua sắm</Link>
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
