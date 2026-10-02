import type { Route } from "./+types/account.addresses.new";
import { requireUser } from "~/lib/auth.server";
import { AccountShell, PageHeading } from "~/components/store/AccountShell";
import { AddressForm } from "~/features/address/components/AddressForm";
import { submitAddress } from "~/features/address/services/address-action.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Thêm địa chỉ — ProjectSale" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context);
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const auth = await requireUser(request, context);
  return submitAddress(request, auth);
}

export default function NewAddress({ actionData }: Route.ComponentProps) {
  return (
    <AccountShell active="addresses">
      <PageHeading back={{ to: "/account/addresses", label: "Về danh sách địa chỉ" }} title="Add address." lead="Thông tin này được dùng làm địa chỉ giao hàng." />
      <AddressForm result={actionData ?? undefined} submitLabel="Lưu địa chỉ" />
      <div style={{ height: 64 }} />
    </AccountShell>
  );
}
