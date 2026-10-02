import { data, redirect } from "react-router";
import type { ServerApiContext } from "~/lib/http.server";
import { actionErrorMessage } from "~/lib/action-error.server";
import { validationErrors } from "~/features/auth/validation/auth.schema";
import * as addressApi from "../api/address.api";
import { addressFormSchema } from "../validation/address.schema";

export type AddressActionData = { error?: string; fieldErrors: Record<string, string> };

/** Tạo (id undefined) hoặc cập nhật địa chỉ từ form; thành công → về danh sách. */
export async function submitAddress(
  request: Request,
  auth: ServerApiContext,
  id?: string,
) {
  const form = await request.formData();
  const finish = async (body: AddressActionData, status: number) => {
    const setCookie = await auth.commit();
    return data(body, { status, headers: setCookie ? { "Set-Cookie": setCookie } : undefined });
  };
  const parsed = addressFormSchema.safeParse({
    receiver_name: form.get("receiver_name") ?? "",
    receiver_phone: form.get("receiver_phone") ?? "",
    line: form.get("line") ?? "",
    city: form.get("city") ?? "",
    district: form.get("district") ?? "",
    ward: form.get("ward") ?? "",
    is_default: form.get("is_default") === "on",
  });
  if (!parsed.success) return finish({ fieldErrors: validationErrors(parsed.error) }, 400);
  try {
    if (id) await addressApi.updateAddress(auth.client, id, parsed.data, request.signal);
    else await addressApi.createAddress(auth.client, parsed.data, request.signal);
  } catch (error) {
    const { status, message } = actionErrorMessage(error);
    return finish({ error: message, fieldErrors: {} }, status);
  }
  const setCookie = await auth.commit();
  return redirect("/account/addresses", setCookie ? { headers: { "Set-Cookie": setCookie } } : undefined);
}
