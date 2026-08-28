import { data } from "react-router";
import { isApiError } from "~/core/api";

/** Backend currently exposes a message, not an error code in JSON. */
export function isPendingAccountError(error: unknown) {
  return (
    isApiError(error) &&
    error.status === 403 &&
    error.message === "Account not verified"
  );
}

export type AuthActionData = {
  error?: string;
  fieldErrors: Record<string, string>;
  message?: string;
  retryAt?: number;
  reloadRequired?: boolean;
  resendAvailableAt?: number;
  otpResetKey?: number;
};
const messages: Record<string, [string, string?]> = {
  "Email already exists": ["Email này đã được sử dụng.", "email"],
  "Phone number already exists": [
    "Số điện thoại này đã được sử dụng.",
    "phone",
  ],
  "Account not verified": [
    "Tài khoản chưa xác thực. Vui lòng đăng nhập để tiếp tục xác thực email.",
  ],
  "Invalid OTP OR expired": ["OTP không đúng hoặc đã hết hạn.", "otp"],
  "OTP has expired or is invalid": ["OTP không đúng hoặc đã hết hạn.", "otp"],
  "Invalid email or password": ["Email hoặc mật khẩu không đúng."],
  "User not found": [
    "Không tìm thấy tài khoản đang hoạt động. Vui lòng kiểm tra email hoặc xác thực tài khoản.",
  ],
  "Account already verified": ["Tài khoản đã xác thực. Bạn có thể đăng nhập."],
  "Account disabled": [
    "Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ bộ phận hỗ trợ.",
  ],
  "Too many requests": ["Bạn thao tác quá nhanh. Vui lòng thử lại sau."],
};
export function authFormError(error: unknown, headers?: Headers) {
  const apiError = isApiError(error) ? error : null;
  const status =
    apiError?.status && apiError.status >= 400 ? apiError.status : 503;
  const translated = messages[apiError?.message ?? ""];
  const fieldErrors: Record<string, string> = {};
  if (translated?.[1]) fieldErrors[translated[1]] = translated[0];
  if (status === 400 && apiError?.detailMessage) {
    for (const detail of apiError.detailMessage.split("; ")) {
      const separator = detail.indexOf(": ");
      const field = detail.slice(0, separator);
      const name = field === "fullName" ? "full_name" : field;
      if (["full_name", "email", "phone", "password", "otp"].includes(name))
        fieldErrors[name] = detail.slice(separator + 2);
    }
  }
  const retryAt =
    status === 429
      ? Date.now() + (apiError?.retryAfter ?? 60) * 1000
      : undefined;
  return data<AuthActionData>(
    {
      error:
        translated?.[0] ??
        (status >= 500
          ? "Không thể kết nối dịch vụ xác thực. Vui lòng thử lại sau."
          : (apiError?.message ?? "Yêu cầu thất bại.")),
      fieldErrors,
      retryAt,
    },
    { status, headers },
  );
}
