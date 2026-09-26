export type AdminStatusTone = "neutral" | "positive" | "warning" | "critical" | "review";
export type AdminAttributeValue = string | number;

export interface AdminResourceRecord {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly attributes: Readonly<Record<string, AdminAttributeValue>>;
  readonly updatedAt: string;
}

export interface AdminResourceInput {
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly attributes: Readonly<Record<string, AdminAttributeValue>>;
}

export interface AdminResourceService {
  list(): Promise<ReadonlyArray<AdminResourceRecord>>;
  create(input: AdminResourceInput): Promise<AdminResourceRecord>;
  update(id: string, input: AdminResourceInput): Promise<AdminResourceRecord>;
}

export interface AdminStatusOption {
  readonly value: string;
  readonly label: string;
  readonly tone: AdminStatusTone;
}

export interface AdminResourceColumn {
  readonly key: string;
  readonly label: string;
  readonly format?: (value: AdminAttributeValue) => string;
}

export interface AdminResourceFormField {
  readonly key: string;
  readonly label: string;
  readonly placeholder: string;
  readonly type?: "text" | "number" | "date";
}

export interface AdminResourceDefinition {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly entityLabel: string;
  readonly countLabel: string;
  readonly searchPlaceholder: string;
  readonly createLabel?: string;
  readonly extensionNote?: string;
  readonly columns: ReadonlyArray<AdminResourceColumn>;
  readonly formFields: ReadonlyArray<AdminResourceFormField>;
  readonly statuses: ReadonlyArray<AdminStatusOption>;
  readonly allowedStatusValues?: (record: AdminResourceRecord) => ReadonlyArray<string>;
}
