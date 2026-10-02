import { z } from "zod";

const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Tối đa ${max} ký tự.`);

export const addressFormSchema = z.object({
  receiver_name: required("Vui lòng nhập tên người nhận.", 120),
  receiver_phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, "Số điện thoại Việt Nam không hợp lệ."),
  line: required("Vui lòng nhập số nhà, tên đường.", 255),
  city: required("Vui lòng chọn tỉnh / thành phố.", 120),
  district: required("Vui lòng chọn quận / huyện.", 120),
  ward: required("Vui lòng chọn phường / xã.", 120),
  is_default: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
