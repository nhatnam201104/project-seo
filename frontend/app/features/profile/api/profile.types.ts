import type { z } from "zod";
import type { changePasswordSchema, updateProfileSchema } from "../validation/profile.schema";

export type Gender = "MALE" | "FEMALE" | "OTHER";

/** GET /users/me — mở rộng AuthUser với các trường hồ sơ. */
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null; // ISO yyyy-MM-dd
  gender: Gender | null;
  avatar_url: string | null;
  email_verified?: boolean;
};

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
