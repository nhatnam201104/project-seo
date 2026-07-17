import { Outlet, useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import { MainLayout } from "~/components/layout/MainLayout";
import { ClientHeader } from "~/components/layout/client/ClientHeader";
import { ClientFooter } from "~/components/layout/client/ClientFooter";
import "~/components/layout/layout.css";

export default function ClientLayout() {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");

  return (
    <MainLayout
      variant="client"
      header={<ClientHeader user={rootData?.user ?? null} />}
      footer={<ClientFooter />}
    >
      <Outlet />
    </MainLayout>
  );
}
