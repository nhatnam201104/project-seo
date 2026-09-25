import type { z } from "zod";
import type {
  authUserSchema,
  deviceSchema,
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  registerRequestSchema,
  resendOtpRequestSchema,
  tokenPairSchema,
  tokenResponseSchema,
  verifyRequestSchema,
} from "../validation/auth.schema";

// AuthRequest/AuthResponse.java use snake_case for tokens/full_name, camelCase for device fields.
export type DeviceInfo = z.infer<typeof deviceSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;
export type ResendOtpRequest = z.infer<typeof resendOtpRequestSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type LoginResponse = z.infer<typeof tokenResponseSchema>;
export type VerifyResponse = LoginResponse;
export type RefreshResponse = z.infer<typeof tokenPairSchema>;
export type RegisterResponse = null;
export type ResendOtpResponse = null;
