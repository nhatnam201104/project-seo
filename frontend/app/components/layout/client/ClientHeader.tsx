import type { AuthUser } from "~/features/auth/api/auth.types";
import { StorefrontHeader } from "~/components/storefront/StorefrontHeader";

type ClientHeaderProps = { user: AuthUser | null };

export function ClientHeader({ user }: ClientHeaderProps) {
  return <StorefrontHeader user={user} />;
}
