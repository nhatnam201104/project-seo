import { useEffect } from "react";
import { data, Form, Link, redirect, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/account.addresses";
import { requireUser } from "~/lib/auth.server";
import { actionErrorMessage, isEndpointMissing } from "~/lib/action-error.server";
import { AccountShell, PageHeading } from "~/components/store/AccountShell";
import * as addressApi from "~/features/address/api/address.api";
import type { Address } from "~/features/address/api/address.types";
import { ADDRESS_NOTICES, fullAddress, isAddressNotice } from "~/features/address/lib/format";
import { useNotificationStore } from "~/stores";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Địa chỉ giao hàng — ProjectSale" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireUser(request, context);
  let addresses: Address[] = [];
  let unavailable = false;
  try {
    addresses = await addressApi.listAddresses(auth.client, request.signal);
  } catch (error) {
    if (!isEndpointMissing(error)) throw error;
    unavailable = true;
  }
  const setCookie = await auth.commit();
  return data({ addresses, unavailable }, setCookie ? { headers: { "Set-Cookie": setCookie } } : undefined);
}

export async function action({ request, context }: Route.ActionArgs) {
  const auth = await requireUser(request, context);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id") ?? "");
  try {
    if (!id) throw { status: 400, message: "Thiếu mã địa chỉ." };
    if (intent === "delete") await addressApi.deleteAddress(auth.client, id, request.signal);
    else if (intent === "default") await addressApi.makeDefaultAddress(auth.client, id, request.signal);
    else throw { status: 400, message: "Yêu cầu không hợp lệ." };
  } catch (error) {
    const { status, message } = actionErrorMessage(error);
    const setCookie = await auth.commit();
    return data({ error: message }, { status, headers: setCookie ? { "Set-Cookie": setCookie } : undefined });
  }
  const setCookie = await auth.commit();
  return redirect(`/account/addresses?notice=${intent === "delete" ? "deleted" : "default"}`, setCookie ? { headers: { "Set-Cookie": setCookie } } : undefined);
}

export default function Addresses({ loaderData, actionData }: Route.ComponentProps) {
  const { addresses, unavailable } = loaderData;
  const navigation = useNavigation();
  const pendingId = navigation.state === "submitting" ? String(navigation.formData?.get("id")) : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const pushToast = useNotificationStore((s) => s.push);
  const notice = searchParams.get("notice");

  useEffect(() => {
    if (notice === null) return;
    if (isAddressNotice(notice)) pushToast("success", ADDRESS_NOTICES[notice]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("notice");
      return next;
    }, { replace: true });
  }, [notice, pushToast, setSearchParams]);

  const sorted = [...addresses].sort((a, b) => Number(b.is_default) - Number(a.is_default));

  return (
    <AccountShell active="addresses">
      <PageHeading
        back={{ to: "/account", label: "Về tổng quan" }}
        title="Addresses."
        lead="Quản lý địa chỉ nhận hàng để thanh toán nhanh hơn."
        action={<Link className="sp-btn" to="/account/addresses/new">+ Thêm địa chỉ</Link>}
      />
      {actionData && "error" in actionData && actionData.error ? <p className="sp-alert sp-alert--error" role="alert" style={{ marginTop: 24 }}>{actionData.error}</p> : null}
      {unavailable ? <p className="sp-alert sp-alert--error" role="status" style={{ marginTop: 24 }}>Chưa tải được danh sách địa chỉ từ máy chủ. Vui lòng thử lại sau.</p> : null}

      <div className="sp-addrs">
        {sorted.map((a, i) => (
          <article key={a.id} className={`sp-addr${a.is_default ? " sp-addr--default" : ""}`} aria-busy={pendingId === a.id}>
            <div className="sp-addr__top"><span>Địa chỉ {i + 1}</span>{a.is_default ? <span className="sp-badge">Mặc định</span> : null}</div>
            <h2>{a.receiver_name}</h2>
            <p>{a.receiver_phone}</p>
            <p>{fullAddress(a)}</p>
            <div className="sp-addr__actions">
              <Link className="sp-link" to={`/account/addresses/${a.id}`}>Sửa</Link>
              {!a.is_default ? (
                <Form method="post"><input type="hidden" name="id" value={a.id} /><button className="sp-link" name="intent" value="default" type="submit">Đặt làm mặc định</button></Form>
              ) : null}
              <Form method="post" onSubmit={(e) => { if (!window.confirm("Xóa địa chỉ này?")) e.preventDefault(); }}>
                <input type="hidden" name="id" value={a.id} /><button className="sp-link sp-link--danger" name="intent" value="delete" type="submit">Xóa</button>
              </Form>
            </div>
          </article>
        ))}
        {!unavailable && sorted.length === 0 ? <p className="sp-empty">Bạn chưa lưu địa chỉ nào.</p> : null}
        <Link className="sp-addr sp-addr--new" to="/account/addresses/new">+ Thêm địa chỉ mới</Link>
      </div>
      <div style={{ height: 64 }} />
    </AccountShell>
  );
}
