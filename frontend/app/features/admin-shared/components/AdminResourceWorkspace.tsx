import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminDrawer } from "./AdminDrawer";
import { AdminStatusBadge } from "./AdminStatusBadge";
import type {
  AdminResourceDefinition,
  AdminResourceInput,
  AdminResourceRecord,
  AdminResourceService,
  AdminStatusOption,
} from "../lib/admin-resource.types";
import { toSlug } from "../lib/slug";
import "../styles/admin-management.css";

const PAGE_SIZE = 6;
const formSchema = z
  .object({
    title: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự."),
    subtitle: z.string().trim().min(2, "Thông tin phụ cần ít nhất 2 ký tự."),
    status: z.string().min(1),
  })
  .passthrough();

type FormValues = Record<string, string> & {
  title: string;
  subtitle: string;
  status: string;
};

interface AdminResourceWorkspaceProps {
  readonly definition: AdminResourceDefinition;
  readonly service: AdminResourceService;
}

function getStatus(
  definition: AdminResourceDefinition,
  value: string,
): AdminStatusOption {
  return (
    definition.statuses.find((status) => status.value === value) ?? {
      value,
      label: value,
      tone: "neutral",
    }
  );
}

export function AdminResourceWorkspace({
  definition,
  service,
}: AdminResourceWorkspaceProps) {
  const [records, setRecords] = useState<ReadonlyArray<AdminResourceRecord>>(
    [],
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminResourceRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch } = useForm<FormValues>();
  const generatedSlug = toSlug(watch("title") ?? "");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await service.list());
    } catch {
      setError("Không thể tải dữ liệu minh họa. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const record = selected;
    if (creating) {
      reset({
        title: "",
        subtitle: "",
        status: definition.statuses[0]?.value ?? "ACTIVE",
      });
      return;
    }
    if (!record) return;
    const attributes = Object.fromEntries(
      definition.formFields.map((field) => [
        `attribute_${field.key}`,
        String(record.attributes[field.key] ?? ""),
      ]),
    );
    reset({
      title: record.title,
      subtitle: record.subtitle,
      status: record.status,
      ...attributes,
    });
  }, [creating, definition.formFields, definition.statuses, reset, selected]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return records.filter((record) => {
      const matchesStatus =
        statusFilter === "ALL" || record.status === statusFilter;
      const haystack = [
        record.title,
        record.subtitle,
        ...Object.values(record.attributes),
      ]
        .join(" ")
        .toLocaleLowerCase("vi");
      return (
        matchesStatus &&
        (!normalizedQuery || haystack.includes(normalizedQuery))
      );
    });
  }, [query, records, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleRecords = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const closeDrawer = useCallback(() => {
    setSelected(null);
    setCreating(false);
    setFormError(null);
  }, []);

  async function onSubmit(values: FormValues) {
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.");
      return;
    }

    if (selected && definition.allowedStatusValues) {
      const allowed = definition.allowedStatusValues(selected);
      if (!allowed.includes(values.status)) {
        setFormError(
          "Chuyển trạng thái này không hợp lệ theo quy trình vận hành.",
        );
        return;
      }
    }

    const input: AdminResourceInput = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      status: values.status,
      attributes: Object.fromEntries(
        definition.formFields.map((field) => [
          field.key,
          field.key === "slug"
            ? toSlug(values.title)
            : (values[`attribute_${field.key}`]?.trim() ?? ""),
        ]),
      ),
    };

    setSaving(true);
    setFormError(null);
    try {
      if (creating) await service.create(input);
      else if (selected) await service.update(selected.id, input);
      await loadRecords();
      closeDrawer();
    } catch {
      setFormError("Không thể lưu thay đổi minh họa. Hãy thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const availableStatuses =
    selected && definition.allowedStatusValues
      ? definition.statuses.filter((status) =>
          definition.allowedStatusValues?.(selected).includes(status.value),
        )
      : definition.statuses;

  return (
    <section
      className="adm-management"
      aria-labelledby="admin-management-heading"
      aria-busy={loading}
    >
      <header className="adm-management__header">
        <div>
          <p className="adm-eyebrow">{definition.eyebrow}</p>
          <h1 id="admin-management-heading">{definition.title}</h1>
          <p>{definition.description}</p>
        </div>
        <div
          className="adm-management__summary"
          aria-label={definition.countLabel}
        >
          <strong>{records.length.toLocaleString("vi-VN")}</strong>
          <span>{definition.countLabel}</span>
        </div>
      </header>

      {definition.extensionNote ? (
        <div className="adm-management__note" role="note">
          {definition.extensionNote}
        </div>
      ) : null}

      <div className="adm-management__toolbar">
        <label>
          <span className="adm-visually-hidden">Tìm kiếm</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={definition.searchPlaceholder}
          />
        </label>
        <label>
          <span>Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {definition.statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        {definition.createLabel ? (
          <button
            className="adm-primary-action"
            type="button"
            onClick={() => setCreating(true)}
          >
            ＋ {definition.createLabel}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="adm-resource-state" role="status">
          <span className="adm-resource-state__loader" />
          Đang tải dữ liệu minh họa…
        </div>
      ) : error ? (
        <div className="adm-resource-state" role="alert">
          <strong>Tải dữ liệu chưa thành công</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void loadRecords()}>
            Thử lại
          </button>
        </div>
      ) : visibleRecords.length === 0 ? (
        <div className="adm-resource-state">
          <strong>Không tìm thấy {definition.entityLabel}</strong>
          <p>Thử đổi từ khóa hoặc bộ lọc trạng thái.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("ALL");
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="adm-resource-table-wrap">
          <table className="adm-resource-table">
            <caption className="adm-visually-hidden">
              {definition.title}
            </caption>
            <thead>
              <tr>
                <th>{definition.entityLabel}</th>
                {definition.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Trạng thái</th>
                <th>
                  <span className="adm-visually-hidden">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id}>
                  <th scope="row">
                    <strong>{record.title}</strong>
                    <span>{record.subtitle}</span>
                  </th>
                  {definition.columns.map((column) => {
                    const value = record.attributes[column.key] ?? "—";
                    return (
                      <td key={column.key} data-label={column.label}>
                        {column.format ? column.format(value) : String(value)}
                      </td>
                    );
                  })}
                  <td data-label="Trạng thái">
                    <AdminStatusBadge
                      status={getStatus(definition, record.status)}
                    />
                  </td>
                  <td>
                    <button
                      className="adm-row-action"
                      type="button"
                      onClick={() => setSelected(record)}
                    >
                      Mở <span aria-hidden="true">↗</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error ? (
        <footer className="adm-pagination">
          <span>
            Hiển thị {visibleRecords.length} / {filtered.length}
          </span>
          <div>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              ← Trước
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau →
            </button>
          </div>
        </footer>
      ) : null}

      <AdminDrawer
        open={creating || selected !== null}
        title={
          creating
            ? (definition.createLabel ?? `Tạo ${definition.entityLabel}`)
            : (selected?.title ?? "Chi tiết")
        }
        description={
          creating
            ? "Dữ liệu chỉ được lưu trong phiên prototype hiện tại."
            : `Cập nhật ${definition.entityLabel} và trạng thái vận hành.`
        }
        onClose={closeDrawer}
      >
        <form className="adm-resource-form" onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span>Tên / tiêu đề</span>
            <input {...register("title")} />
          </label>
          <label>
            <span>Thông tin phụ</span>
            <input {...register("subtitle")} />
          </label>
          {definition.formFields.map((field) =>
            field.key === "slug" ? (
              <label key={field.key}>
                <span>Slug</span>
                <input
                  aria-label="Slug"
                  className="adm-resource-form__generated"
                  value={generatedSlug}
                  placeholder="slug"
                  readOnly
                />
                <small>Tự cập nhật theo tên hoặc tiêu đề.</small>
              </label>
            ) : (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  {...register(`attribute_${field.key}`)}
                />
              </label>
            ),
          )}
          <label>
            <span>Trạng thái</span>
            <select {...register("status")}>
              {availableStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          {formError ? (
            <p className="adm-resource-form__error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="adm-resource-form__actions">
            <button type="button" onClick={closeDrawer}>
              Hủy
            </button>
            <button
              className="adm-primary-action"
              type="submit"
              disabled={saving}
            >
              {saving ? "Đang lưu…" : creating ? "Tạo bản ghi" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </section>
  );
}
