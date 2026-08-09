import type {
  AdminResourceInput,
  AdminResourceRecord,
  AdminResourceService,
} from "../lib/admin-resource.types";

function freezeRecord(record: AdminResourceRecord): AdminResourceRecord {
  return Object.freeze({ ...record, attributes: Object.freeze({ ...record.attributes }) });
}

export function createMockAdminResourceService(
  initialRecords: ReadonlyArray<AdminResourceRecord>,
): AdminResourceService {
  let records = initialRecords.map(freezeRecord);

  return {
    async list() {
      return records.map(freezeRecord);
    },
    async create(input: AdminResourceInput) {
      const record = freezeRecord({
        ...input,
        id: `mock-${Date.now()}-${records.length + 1}`,
        updatedAt: new Date().toISOString(),
      });
      records = [record, ...records];
      return record;
    },
    async update(id: string, input: AdminResourceInput) {
      const current = records.find((record) => record.id === id);
      if (!current) throw new Error("RESOURCE_NOT_FOUND");
      const updated = freezeRecord({
        ...current,
        ...input,
        id,
        updatedAt: new Date().toISOString(),
      });
      records = records.map((record) => record.id === id ? updated : record);
      return updated;
    },
  };
}
