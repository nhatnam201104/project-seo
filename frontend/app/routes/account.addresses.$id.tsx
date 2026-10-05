import { data } from "react-router";
import type { Route } from "./+types/account.addresses.$id";
import { requireUser } from "~/lib/auth.server";
import { AccountShell, PageHeading } from "~/components/store/AccountShell";
import * as addressApi from "~/features/address/api/address.api";
import { AddressForm } from "~/features/address/components/AddressForm";
import { submitAddress } from "~/features/address/services/address-action.server";
import { isApiError } from "~/core/api";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Sửa địa chỉ — ProjectSale" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const auth = await requireUser(request, context);
  try {
    const address = await addressApi.getAddress(auth.client, params.id, request.signal);
    const setCookie = await auth.commit();
    return data({ address }, setCookie ? { headers: { "Set-Cookie": setCookie } } : undefined);
  } catch (error) {
    if (isApiError(error) && (error.status === 404 || error.status === 403 || error.status === 400)) {
      throw new Response("Không tìm thấy địa chỉ", { status: 404 });
    }
    throw error;
  }
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const auth = await requireUser(request, context);
  return submitAddress(request, auth, params.id);
}

export default function EditAddress({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <AccountShell active="addresses">
      <PageHeading back={{ to: "/account/addresses", label: "Về danh sách địa chỉ" }} title="Edit address." lead="Cập nhật thông tin nhận hàng." />
      <AddressForm address={loaderData.address} result={actionData ?? undefined} submitLabel="Lưu thay đổi" />
      <div style={{ height: 64 }} />
    </AccountShell>
  );
}
