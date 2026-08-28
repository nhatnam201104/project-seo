import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import { StorefrontHeader } from "~/components/storefront/StorefrontHeader";

export function SiteHeader() {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  return <StorefrontHeader user={rootData?.user ?? null} overlay />;
}
