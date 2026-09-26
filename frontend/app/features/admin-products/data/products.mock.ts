import type { AdminResourceRecord } from "~/features/admin-shared/lib/admin-resource.types";

export const ADMIN_PRODUCTS_MOCK: ReadonlyArray<AdminResourceRecord> = [
  { id: "p-01", title: "MORAINE Core 01", subtitle: "Gọng titan · RayBan", status: "ACTIVE", attributes: { sku: "MOR-C01-BLK", stock: 8, price: 1400000 }, updatedAt: "2026-08-09T08:20:00Z" },
  { id: "p-02", title: "VISOR Titanium V2", subtitle: "Gọng vuông · Oakley", status: "ACTIVE", attributes: { sku: "VSR-TI02-SLV", stock: 3, price: 1600000 }, updatedAt: "2026-08-09T07:15:00Z" },
  { id: "p-03", title: "MORAINE Air 03", subtitle: "Gọng không viền · Bolon", status: "ACTIVE", attributes: { sku: "MOR-A03-AMB", stock: 18, price: 1400000 }, updatedAt: "2026-08-08T10:00:00Z" },
  { id: "p-04", title: "VISOR Archive 01", subtitle: "Kính râm · Gentle Monster", status: "INACTIVE", attributes: { sku: "VSR-A01-GRN", stock: 0, price: 1500000 }, updatedAt: "2026-08-07T09:30:00Z" },
  { id: "p-05", title: "MORAINE Studio 02", subtitle: "Gọng acetate · Gucci", status: "ACTIVE", attributes: { sku: "MOR-S02-CLR", stock: 22, price: 1400000 }, updatedAt: "2026-08-06T11:40:00Z" },
  { id: "p-06", title: "LUMEN Kids K4", subtitle: "Gọng trẻ em · Molsion", status: "ACTIVE", attributes: { sku: "LUM-K04-BLU", stock: 12, price: 780000 }, updatedAt: "2026-08-05T14:00:00Z" },
  { id: "p-07", title: "ATLAS Sun 07", subtitle: "Kính râm phân cực · Police", status: "INACTIVE", attributes: { sku: "ATL-S07-BRN", stock: 5, price: 1850000 }, updatedAt: "2026-08-04T08:45:00Z" },
];
